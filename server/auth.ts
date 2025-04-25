import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // 환경 변수에서 세션 비밀키를 가져오거나, 개발 환경에서만 임시값 사용
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret && process.env.NODE_ENV === 'production') {
    console.error('SESSION_SECRET 환경 변수가 설정되지 않았습니다. 보안을 위해 실제 배포 환경에서는 반드시 설정해야 합니다.');
    throw new Error('SESSION_SECRET 환경 변수가 필요합니다.');
  }
  
  // 쿠키 설정 추가 (보안 강화)
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret || (process.env.NODE_ENV === 'development' ? '개발환경-임시키-변경필요' : ''),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true, // JavaScript에서 쿠키에 접근 불가능하게 설정
      secure: process.env.NODE_ENV === 'production', // HTTPS에서만 쿠키 전송
      sameSite: 'strict' // CSRF 방지
    }
  };

  // 무차별 대입 공격 방지를 위한 로그인 시도 제한
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분 간격
    max: 5, // 15분 동안 최대 5번의 요청만 허용
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "너무 많은 로그인 시도가 있었습니다. 15분 후에 다시 시도해주세요." },
    skipSuccessfulRequests: true // 성공한 요청은 제한에 포함하지 않음
  });
  
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "아이디 또는 비밀번호가 올바르지 않습니다." });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // 회원가입도 rate limit 적용
  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 5, // 시간당 최대 5번의 계정 생성만 허용
    message: { message: "너무 많은 계정 생성 시도가 있었습니다. 1시간 후에 다시 시도해주세요." },
    standardHeaders: true,
    legacyHeaders: false
  });

  app.post("/api/register", registerLimiter, async (req, res, next) => {
    try {
      const { username, password, nickname, profileImage, confirmPassword, agreeToTerms } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "이미 사용 중인 아이디입니다." });
      }
      
      // Validate password matching
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
      }
      
      // 비밀번호 강도 확인
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
          message: "비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자(@$!%*?&)를 포함해야 합니다." 
        });
      }
      
      // Validate terms agreement
      if (!agreeToTerms) {
        return res.status(400).json({ message: "이용약관에 동의해주세요." });
      }
      
      // Create the user
      const userData = insertUserSchema.parse({
        username,
        password: await hashPassword(password),
        nickname,
        profileImage
      });
      
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", loginLimiter, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "로그인에 실패했습니다." });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "로그인이 필요합니다." });
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });
}
