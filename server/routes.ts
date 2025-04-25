import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupChatHandlers } from "./chat";
import Stripe from "stripe";
import { 
  insertProductSchema, 
  insertFavoriteSchema, 
  insertChatRoomSchema, 
  insertChatMessageSchema,
  insertCommentSchema,
  insertReportSchema,
  insertBlockSchema,
  User
} from "@shared/schema";

// Stripe 초기화
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY 환경 변수가 설정되지 않았습니다.');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Admin middleware
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    }
    
    next();
  };

  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const { category, location, search, sellerId } = req.query;
      
      let products;
      if (category) {
        products = await storage.getProductsByCategory(category as string);
      } else if (location) {
        products = await storage.getProductsByLocation(location as string);
      } else if (search) {
        products = await storage.getProductsBySearch(search as string);
      } else if (sellerId) {
        products = await storage.getProductsBySellerId(Number(sellerId));
      } else {
        products = await storage.getAllProducts();
      }
      
      // If user is authenticated, filter out products from blocked users
      if (req.isAuthenticated()) {
        const blockedUsers = await storage.getBlocksByBlockerId(req.user!.id);
        const blockedUserIds = blockedUsers.map(block => block.blockedUserId);
        
        products = products.filter(product => !blockedUserIds.includes(product.sellerId));
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "상품 목록을 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  app.get("/api/products/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const products = await storage.getRecentProducts(limit);
      
      // Filter blocked users if authenticated
      if (req.isAuthenticated()) {
        const blockedUsers = await storage.getBlocksByBlockerId(req.user!.id);
        const blockedUserIds = blockedUsers.map(block => block.blockedUserId);
        
        const filteredProducts = products.filter(product => !blockedUserIds.includes(product.sellerId));
        res.json(filteredProducts);
      } else {
        res.json(products);
      }
    } catch (error) {
      res.status(500).json({ message: "최근 상품을 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
      }
      
      // Check if user is blocked before showing product
      if (req.isAuthenticated()) {
        const isBlocked = await storage.isUserBlocked(req.user!.id, product.sellerId);
        if (isBlocked) {
          return res.status(403).json({ message: "차단된 사용자의 상품입니다." });
        }
      }
      
      // Increment view count
      await storage.incrementProductView(productId);
      
      // Get updated product with incremented view count
      const updatedProduct = await storage.getProduct(productId);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "상품 정보를 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        sellerId: req.user!.id
      });
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "상품 등록에 실패했습니다.", error });
    }
  });
  
  app.patch("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
      }
      
      // Check if user is owner or admin
      if (product.sellerId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "상품을 수정할 권한이 없습니다." });
      }
      
      const updatedProduct = await storage.updateProduct(productId, req.body);
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ message: "상품 수정에 실패했습니다." });
    }
  });
  
  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
      }
      
      // Check if user is owner or admin
      if (product.sellerId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "상품을 삭제할 권한이 없습니다." });
      }
      
      const result = await storage.deleteProduct(productId);
      
      if (result) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "상품 삭제에 실패했습니다." });
      }
    } catch (error) {
      res.status(500).json({ message: "상품 삭제 중 오류가 발생했습니다." });
    }
  });
  
  // Favorites API
  app.get("/api/favorites", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const favorites = await storage.getFavoritesByUserId(req.user!.id);
      
      // Fetch product details for each favorite
      const favoritesWithProducts = await Promise.all(
        favorites.map(async (favorite) => {
          const product = await storage.getProduct(favorite.productId);
          return { ...favorite, product };
        })
      );
      
      res.json(favoritesWithProducts);
    } catch (error) {
      res.status(500).json({ message: "찜 목록을 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  app.get("/api/products/:id/favorites", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const count = await storage.getFavoriteCount(productId);
      
      let isFavorited = false;
      if (req.isAuthenticated()) {
        const favorite = await storage.getFavorite(req.user!.id, productId);
        isFavorited = !!favorite;
      }
      
      res.json({ count, isFavorited });
    } catch (error) {
      res.status(500).json({ message: "찜 정보를 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  app.post("/api/favorites", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const favoriteData = insertFavoriteSchema.parse({
        userId: req.user!.id,
        productId: req.body.productId
      });
      
      // Check if already favorited
      const existing = await storage.getFavorite(favoriteData.userId, favoriteData.productId);
      if (existing) {
        return res.status(400).json({ message: "이미 찜한 상품입니다." });
      }
      
      const favorite = await storage.createFavorite(favoriteData);
      res.status(201).json(favorite);
    } catch (error) {
      res.status(400).json({ message: "찜하기에 실패했습니다." });
    }
  });
  
  app.delete("/api/favorites/:productId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const productId = parseInt(req.params.productId);
      const result = await storage.deleteFavorite(req.user!.id, productId);
      
      if (result) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "찜한 상품을 찾을 수 없습니다." });
      }
    } catch (error) {
      res.status(500).json({ message: "찜 삭제 중 오류가 발생했습니다." });
    }
  });
  
  // Chat API
  app.get("/api/chats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const userId = req.user!.id;
      const chatRooms = await storage.getChatRoomsByUserId(userId);
      
      // Fetch additional details for each chat room
      const enhancedChatRooms = await Promise.all(
        chatRooms.map(async (room) => {
          const otherUserId = room.buyerId === userId ? room.sellerId : room.buyerId;
          const otherUser = await storage.getUser(otherUserId);
          const product = await storage.getProduct(room.productId);
          const messages = await storage.getChatMessages(room.id);
          
          // Get last message and unread count
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
          const unreadCount = messages.filter(msg => !msg.isRead && msg.senderId !== userId).length;
          
          return {
            ...room,
            otherUser,
            product,
            lastMessage,
            unreadCount
          };
        })
      );
      
      // Filter out chat rooms with blocked users
      const blockedUsers = await storage.getBlocksByBlockerId(userId);
      const blockedUserIds = blockedUsers.map(block => block.blockedUserId);
      
      const filteredChatRooms = enhancedChatRooms.filter(room => {
        const otherUserId = room.buyerId === userId ? room.sellerId : room.buyerId;
        return !blockedUserIds.includes(otherUserId);
      });
      
      res.json(filteredChatRooms);
    } catch (error) {
      res.status(500).json({ message: "채팅방 목록을 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  // 채팅방 상세 정보 API
  app.get("/api/chats/:chatRoomId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const chatRoomId = parseInt(req.params.chatRoomId);
      const userId = req.user!.id;
      
      // 채팅방 정보 가져오기
      const chatRoom = await storage.getChatRoom(chatRoomId);
      
      if (!chatRoom) {
        return res.status(404).json({ message: "채팅방을 찾을 수 없습니다." });
      }
      
      // 사용자가 해당 채팅방의 참여자인지 확인
      if (chatRoom.buyerId !== userId && chatRoom.sellerId !== userId) {
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }
      
      // 상대방 정보 가져오기
      const otherUserId = chatRoom.buyerId === userId ? chatRoom.sellerId : chatRoom.buyerId;
      const buyer = await storage.getUser(chatRoom.buyerId);
      const seller = await storage.getUser(chatRoom.sellerId);
      const otherUser = await storage.getUser(otherUserId);
      
      // 상품 정보 가져오기
      const product = await storage.getProduct(chatRoom.productId);
      
      // 차단 상태 확인
      const isBlocked = await storage.isUserBlocked(userId, otherUserId);
      const isBlockedBy = await storage.isUserBlocked(otherUserId, userId);
      
      // 온라인 상태 추가 (WebSocket 연결 상태로 판단)
      // 실제 구현에서는 WebSocket 연결 상태를 확인하는 로직이 필요합니다.
      
      res.json({
        ...chatRoom,
        buyer,
        seller,
        otherUser,
        product,
        isBlocked,
        isBlockedBy
      });
    } catch (error) {
      console.error("채팅방 상세 정보 조회 오류:", error);
      res.status(500).json({ message: "채팅방 정보를 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  app.get("/api/chats/unread", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      // 읽지 않은 메시지 수를 직접 storage 메소드로 구하기
      const unreadCount = await storage.getUnreadMessageCount(req.user!.id);
      
      // 항상 200 응답과 함께 count 값 반환
      return res.status(200).json({ count: unreadCount });
    } catch (error) {
      console.error("읽지 않은 메시지 수 조회 오류:", error);
      // 오류 발생 시에도 0을 반환하고 200 상태 코드 유지
      return res.status(200).json({ count: 0 });
    }
  });
  
  app.post("/api/chats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const { productId, sellerId } = req.body;
      const buyerId = req.user!.id;
      
      // Check if chat room already exists
      let chatRoom = await storage.getChatRoomByUserAndProduct(buyerId, sellerId, productId);
      
      if (!chatRoom) {
        // Create new chat room
        const chatRoomData = insertChatRoomSchema.parse({
          productId,
          buyerId,
          sellerId
        });
        
        chatRoom = await storage.createChatRoom(chatRoomData);
      }
      
      res.status(201).json(chatRoom);
    } catch (error) {
      res.status(400).json({ message: "채팅방 생성에 실패했습니다." });
    }
  });
  
  app.get("/api/chats/:chatRoomId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const chatRoomId = parseInt(req.params.chatRoomId);
      const chatRoom = await storage.getChatRoom(chatRoomId);
      
      if (!chatRoom) {
        return res.status(404).json({ message: "채팅방을 찾을 수 없습니다." });
      }
      
      // Check if user is a participant in this chat room
      if (chatRoom.buyerId !== req.user!.id && chatRoom.sellerId !== req.user!.id) {
        return res.status(403).json({ message: "접근 권한이 없습니다." });
      }
      
      const messages = await storage.getChatMessages(chatRoomId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(chatRoomId, req.user!.id);
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "메시지를 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  // 폴링 방식으로 새 메시지를 가져오는 API
  app.get("/api/chats/:chatRoomId/messages/poll", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const chatRoomId = parseInt(req.params.chatRoomId);
      const userId = req.user!.id;
      const lastMessageId = req.query.lastMessageId ? parseInt(req.query.lastMessageId as string) : 0;
      
      // 채팅방 존재 여부 확인
      const chatRoom = await storage.getChatRoom(chatRoomId);
      if (!chatRoom) {
        return res.status(404).json({ message: "채팅방을 찾을 수 없습니다." });
      }
      
      // 사용자가 해당 채팅방에 속해 있는지 확인
      if (chatRoom.buyerId !== userId && chatRoom.sellerId !== userId) {
        return res.status(403).json({ message: "이 채팅방에 접근할 권한이 없습니다." });
      }
      
      // 모든 메시지 가져오기
      const messages = await storage.getChatMessages(chatRoomId);
      
      // 마지막 메시지 ID 이후의 새 메시지만 필터링
      const newMessages = lastMessageId > 0 
        ? messages.filter(msg => msg.id > lastMessageId)
        : messages;
      
      // 상대방이 보낸 메시지들만 읽음 처리
      const otherUserMessages = newMessages.filter(msg => msg.senderId !== userId);
      if (otherUserMessages.length > 0) {
        await storage.markMessagesAsRead(chatRoomId, userId);
      }
      
      res.json(newMessages);
    } catch (error) {
      console.error("새 메시지 폴링 오류:", error);
      res.status(500).json({ message: "새 메시지를 확인하는 중 오류가 발생했습니다." });
    }
  });
  
  // 새 메시지 전송 API 엔드포인트
  app.post("/api/chats/:chatRoomId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const chatRoomId = parseInt(req.params.chatRoomId);
      const userId = req.user!.id;
      const messageText = req.body.message;
      
      if (!messageText || messageText.trim() === "") {
        return res.status(400).json({ message: "메시지 내용이 필요합니다." });
      }
      
      // 채팅방 존재 여부 확인
      const chatRoom = await storage.getChatRoom(chatRoomId);
      if (!chatRoom) {
        return res.status(404).json({ message: "채팅방을 찾을 수 없습니다." });
      }
      
      // 사용자가 해당 채팅방에 속해 있는지 확인
      if (chatRoom.buyerId !== userId && chatRoom.sellerId !== userId) {
        return res.status(403).json({ message: "이 채팅방에 메시지를 보낼 권한이 없습니다." });
      }
      
      // 상대방이 사용자를 차단했는지 확인
      const otherUserId = chatRoom.buyerId === userId ? chatRoom.sellerId : chatRoom.buyerId;
      const isBlocked = await storage.isUserBlocked(otherUserId, userId);
      if (isBlocked) {
        return res.status(403).json({ message: "상대방이 당신을 차단했습니다. 메시지를 보낼 수 없습니다." });
      }
      
      // XSS 방어를 위한 메시지 필터링
      const sanitizedMessage = messageText.trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
      
      // 새 메시지 생성
      const messageData = insertChatMessageSchema.parse({
        chatRoomId,
        senderId: userId,
        message: sanitizedMessage,
        isRead: false
      });
      
      const message = await storage.createChatMessage(messageData);
      
      res.status(201).json(message);
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      res.status(500).json({ message: "메시지 전송 중 오류가 발생했습니다." });
    }
  });
  
  // Comments API
  app.get("/api/products/:id/comments", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const comments = await storage.getCommentsByProductId(productId);
      
      // Add user info to each comment
      const enhancedComments = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.userId);
          return { ...comment, user };
        })
      );
      
      // Filter comments by blocked users if authenticated
      if (req.isAuthenticated()) {
        const blockedUsers = await storage.getBlocksByBlockerId(req.user!.id);
        const blockedUserIds = blockedUsers.map(block => block.blockedUserId);
        
        const filteredComments = enhancedComments.filter(comment => !blockedUserIds.includes(comment.userId));
        res.json(filteredComments);
      } else {
        res.json(enhancedComments);
      }
    } catch (error) {
      res.status(500).json({ message: "댓글을 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  app.post("/api/products/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const productId = parseInt(req.params.id);
      
      // Verify product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
      }
      
      // XSS 방어를 위한 내용 필터링
      const sanitizedContent = req.body.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
        
      const commentData = insertCommentSchema.parse({
        productId,
        userId: req.user!.id,
        content: sanitizedContent
      });
      
      const comment = await storage.createComment(commentData);
      
      // Add user info to the response
      const user = await storage.getUser(comment.userId);
      res.status(201).json({ ...comment, user });
    } catch (error) {
      res.status(400).json({ message: "댓글 작성에 실패했습니다." });
    }
  });
  
  app.delete("/api/comments/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const commentId = parseInt(req.params.id);
      const comment = await storage.getCommentsByProductId(commentId);
      
      const foundComment = comment.find(c => c.id === commentId);
      if (!foundComment) {
        return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
      }
      
      // Check if user is the author of the comment or an admin
      if (foundComment.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "댓글을 삭제할 권한이 없습니다." });
      }
      
      const result = await storage.deleteComment(commentId);
      
      if (result) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "댓글 삭제에 실패했습니다." });
      }
    } catch (error) {
      res.status(500).json({ message: "댓글 삭제 중 오류가 발생했습니다." });
    }
  });
  
  // Report API
  app.post("/api/reports", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      // 신고 내용에서 XSS 방어를 위한 필터링
      const sanitizedReportData = { ...req.body };
      if (sanitizedReportData.reason) {
        sanitizedReportData.reason = sanitizedReportData.reason
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      }
      
      const reportData = insertReportSchema.parse({
        ...sanitizedReportData,
        reporterId: req.user!.id
      });
      
      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "신고 제출에 실패했습니다." });
    }
  });
  
  // Admin only endpoint
  app.get("/api/reports", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) {
      return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
    }
    
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "신고 목록을 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  // Block API
  // User API
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      
      // 보안을 위해 비밀번호 필드 제거
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "사용자 정보를 불러오는 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/blocks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const blocks = await storage.getBlocksByBlockerId(req.user!.id);
      
      // Add user info to each block
      const enhancedBlocks = await Promise.all(
        blocks.map(async (block) => {
          const blockedUser = await storage.getUser(block.blockedUserId);
          return { ...block, blockedUser };
        })
      );
      
      res.json(enhancedBlocks);
    } catch (error) {
      res.status(500).json({ message: "차단 목록을 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  app.post("/api/blocks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const blockData = insertBlockSchema.parse({
        blockerId: req.user!.id,
        blockedUserId: req.body.blockedUserId
      });
      
      // Check if already blocked
      const isBlocked = await storage.isUserBlocked(blockData.blockerId, blockData.blockedUserId);
      if (isBlocked) {
        return res.status(400).json({ message: "이미 차단된 사용자입니다." });
      }
      
      const block = await storage.createBlock(blockData);
      res.status(201).json(block);
    } catch (error) {
      res.status(400).json({ message: "사용자 차단에 실패했습니다." });
    }
  });
  
  app.delete("/api/blocks/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    try {
      const blockedUserId = parseInt(req.params.userId);
      const result = await storage.deleteBlock(req.user!.id, blockedUserId);
      
      if (result) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "차단된 사용자를 찾을 수 없습니다." });
      }
    } catch (error) {
      res.status(500).json({ message: "차단 해제 중 오류가 발생했습니다." });
    }
  });

  // Admin API
  app.get("/api/admin/reports", requireAdmin, async (req, res) => {
    try {
      const reports = await storage.getReports();
      
      // 상세 정보 가져오기
      const enhancedReports = await Promise.all(
        reports.map(async (report) => {
          let reportedUser = null;
          let reportedProduct = null;
          
          if (report.reportedUserId) {
            reportedUser = await storage.getUser(report.reportedUserId);
          }
          
          if (report.reportedProductId) {
            reportedProduct = await storage.getProduct(report.reportedProductId);
          }
          
          return {
            ...report,
            reportedUser,
            reportedProduct,
            status: report.status || '처리중'
          };
        })
      );
      
      res.json(enhancedReports);
    } catch (error) {
      res.status(500).json({ message: "신고 목록을 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  app.post("/api/admin/reports/:id/handle", requireAdmin, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const { action } = req.body;
      
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "신고를 찾을 수 없습니다." });
      }
      
      // 액션에 따라 다른 처리
      if (action === 'ban_user' && report.reportedUserId) {
        // 사용자 차단 처리 (실제로는 차단 처리할 수도 있음)
        await storage.updateReport(reportId, { status: '사용자 차단 처리됨' });
      } else if (action === 'delete_content' && report.reportedProductId) {
        // 콘텐츠 삭제 처리
        await storage.updateReport(reportId, { status: '콘텐츠 삭제됨' });
      } else if (action === 'ignore') {
        // 무시 처리
        await storage.updateReport(reportId, { status: '처리 무시됨' });
      } else {
        return res.status(400).json({ message: "유효하지 않은 액션입니다." });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "신고 처리 중 오류가 발생했습니다." });
    }
  });
  
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      // 모든 사용자 정보 가져오기
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "사용자 목록을 불러오는 중 오류가 발생했습니다." });
    }
  });
  
  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isAdmin } = req.body;
      
      // 관리자 권한 자체를 제거하려는 경우 검증
      if (userId === req.user!.id && isAdmin === false) {
        return res.status(400).json({ message: "자신의 관리자 권한은 해제할 수 없습니다." });
      }
      
      const updatedUser = await storage.setAdminStatus(userId, isAdmin);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "사용자 권한 변경 중 오류가 발생했습니다." });
    }
  });
  
  // 사용자 정보 수정 API
  app.patch("/api/admin/users/:id/profile", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { nickname, profileImage } = req.body;
      
      // 변경할 내용이 있는지 확인
      if (!nickname && !profileImage) {
        return res.status(400).json({ message: "변경할 정보가 없습니다." });
      }
      
      // 관리자가 자신의 계정을 수정하려는 경우
      if (userId === req.user!.id && !nickname) {
        return res.status(400).json({ message: "관리자 계정의 닉네임은 필수입니다." });
      }
      
      const userData: Partial<User> = {};
      if (nickname) userData.nickname = nickname;
      if (profileImage !== undefined) userData.profileImage = profileImage;
      
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "사용자 정보 수정 중 오류가 발생했습니다." });
    }
  });
  
  // 사용자 삭제 API
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // 자기 자신은 삭제할 수 없음
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "자신의 계정은 삭제할 수 없습니다." });
      }
      
      const userExists = await storage.getUser(userId);
      if (!userExists) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      
      // 계정 삭제 실행 (관련 데이터 모두 삭제)
      const result = await storage.deleteUser(userId);
      
      if (result) {
        res.status(204).end(); // 성공 응답, 본문 없음
      } else {
        res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
    } catch (error) {
      res.status(500).json({ message: "사용자 삭제 중 오류가 발생했습니다." });
    }
  });

  // Stripe 결제 API
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    try {
      const { amount, productId, sellerId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "유효한 결제 금액이 필요합니다." });
      }

      // 상품 확인
      if (productId) {
        const product = await storage.getProduct(productId);
        if (!product) {
          return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
        }
      }
      
      // 결제 의도 생성
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // 한국 원화는 소수점이 없으므로 변환 없이 사용
        currency: "krw", // 한국 원화 사용
        metadata: {
          buyerId: req.user!.id.toString(),
          sellerId: sellerId ? sellerId.toString() : "",
          productId: productId ? productId.toString() : "",
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Stripe 결제 의도 생성 오류:", error);
      res.status(500).json({ 
        message: "결제 정보 생성 중 오류가 발생했습니다.", 
        error: error.message 
      });
    }
  });

  app.post("/api/payment-success", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    try {
      const { paymentIntentId, productId } = req.body;
      
      // Stripe에서 결제 정보 확인
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "결제가 완료되지 않았습니다." });
      }
      
      // 제품 상태 업데이트 (판매 완료로 변경)
      if (productId) {
        await storage.updateProduct(parseInt(productId), { status: "sold" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("결제 완료 처리 오류:", error);
      res.status(500).json({ 
        message: "결제 완료 처리 중 오류가 발생했습니다.", 
        error: error.message 
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  console.log("WebSocket 서버 설정: /ws 경로");
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    perMessageDeflate: false, // Disable compression for simpler debugging
  });
  
  wss.on('listening', () => {
    console.log("WebSocket 서버 실행 중");
  });
  
  wss.on('error', (error) => {
    console.error("WebSocket 서버 오류:", error);
  });
  
  setupChatHandlers(wss, storage);

  return httpServer;
}
