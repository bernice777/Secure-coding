import { users, products, favorites, chatRooms, chatMessages, comments, reports, blocks } from "@shared/schema";
import type { 
  User, InsertUser, 
  Product, InsertProduct,
  Favorite, InsertFavorite,
  ChatRoom, InsertChatRoom,
  ChatMessage, InsertChatMessage,
  Comment, InsertComment,
  Report, InsertReport,
  Block, InsertBlock 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  setAdminStatus(id: number, isAdmin: boolean): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  
  // Product related methods
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProductsByLocation(location: string): Promise<Product[]>;
  getProductsBySellerId(sellerId: number): Promise<Product[]>;
  getProductsBySearch(search: string): Promise<Product[]>;
  getRecentProducts(limit: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  incrementProductView(id: number): Promise<void>;
  
  // Favorite related methods
  getFavoritesByUserId(userId: number): Promise<Favorite[]>;
  getFavoritesByProductId(productId: number): Promise<Favorite[]>;
  getFavoriteCount(productId: number): Promise<number>;
  getFavorite(userId: number, productId: number): Promise<Favorite | undefined>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(userId: number, productId: number): Promise<boolean>;
  
  // Chat related methods
  getChatRoom(id: number): Promise<ChatRoom | undefined>;
  getChatRoomByUserAndProduct(buyerId: number, sellerId: number, productId: number): Promise<ChatRoom | undefined>;
  getChatRoomsByUserId(userId: number): Promise<ChatRoom[]>;
  createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom>;
  
  getChatMessages(chatRoomId: number): Promise<ChatMessage[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(chatRoomId: number, userId: number): Promise<void>;
  
  // Comment related methods
  getCommentsByProductId(productId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // Report related methods
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  updateReport(id: number, report: Partial<Report>): Promise<Report | undefined>;
  
  // Block related methods
  getBlocksByBlockerId(blockerId: number): Promise<Block[]>;
  createBlock(block: InsertBlock): Promise<Block>;
  deleteBlock(blockerId: number, blockedUserId: number): Promise<boolean>;
  isUserBlocked(blockerId: number, blockedUserId: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private favorites: Map<number, Favorite>;
  private chatRooms: Map<number, ChatRoom>;
  private chatMessages: Map<number, ChatMessage>;
  private comments: Map<number, Comment>;
  private reports: Map<number, Report>;
  private blocks: Map<number, Block>;
  
  sessionStore: session.SessionStore;
  
  currentUserId: number;
  currentProductId: number;
  currentFavoriteId: number;
  currentChatRoomId: number;
  currentChatMessageId: number;
  currentCommentId: number;
  currentReportId: number;
  currentBlockId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.favorites = new Map();
    this.chatRooms = new Map();
    this.chatMessages = new Map();
    this.comments = new Map();
    this.reports = new Map();
    this.blocks = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentFavoriteId = 1;
    this.currentChatRoomId = 1;
    this.currentChatMessageId = 1;
    this.currentCommentId = 1;
    this.currentReportId = 1;
    this.currentBlockId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, isAdmin: false, rating: 0, transactionCount: 0 };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async setAdminStatus(id: number, isAdmin: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    // Update admin status
    const updatedUser = { ...user, isAdmin };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.category === category)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getProductsByLocation(location: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.location.includes(location))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getProductsBySellerId(sellerId: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.sellerId === sellerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getProductsBySearch(search: string): Promise<Product[]> {
    const searchLower = search.toLowerCase();
    return Array.from(this.products.values())
      .filter(product => 
        product.title.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        product.location.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getRecentProducts(limit: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const now = new Date();
    const product: Product = { 
      ...insertProduct, 
      id, 
      createdAt: now, 
      viewCount: 0,
      buyerId: null
    };
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  async incrementProductView(id: number): Promise<void> {
    const product = this.products.get(id);
    if (product) {
      product.viewCount += 1;
      this.products.set(id, product);
    }
  }
  
  // Favorite methods
  async getFavoritesByUserId(userId: number): Promise<Favorite[]> {
    return Array.from(this.favorites.values())
      .filter(favorite => favorite.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getFavoritesByProductId(productId: number): Promise<Favorite[]> {
    return Array.from(this.favorites.values())
      .filter(favorite => favorite.productId === productId);
  }
  
  async getFavoriteCount(productId: number): Promise<number> {
    return Array.from(this.favorites.values())
      .filter(favorite => favorite.productId === productId).length;
  }
  
  async getFavorite(userId: number, productId: number): Promise<Favorite | undefined> {
    return Array.from(this.favorites.values())
      .find(favorite => favorite.userId === userId && favorite.productId === productId);
  }
  
  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = this.currentFavoriteId++;
    const now = new Date();
    const favorite: Favorite = { ...insertFavorite, id, createdAt: now };
    this.favorites.set(id, favorite);
    return favorite;
  }
  
  async deleteFavorite(userId: number, productId: number): Promise<boolean> {
    const favorite = await this.getFavorite(userId, productId);
    if (!favorite) return false;
    
    return this.favorites.delete(favorite.id);
  }
  
  // Chat methods
  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    return this.chatRooms.get(id);
  }
  
  async getChatRoomByUserAndProduct(buyerId: number, sellerId: number, productId: number): Promise<ChatRoom | undefined> {
    return Array.from(this.chatRooms.values())
      .find(room => 
        room.buyerId === buyerId && 
        room.sellerId === sellerId && 
        room.productId === productId
      );
  }
  
  async getChatRoomsByUserId(userId: number): Promise<ChatRoom[]> {
    // 채팅방이 없는 경우 빈 배열 반환 (null 반환이 아님)
    if (this.chatRooms.size === 0) {
      return [];
    }
    
    return Array.from(this.chatRooms.values())
      .filter(room => room.buyerId === userId || room.sellerId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createChatRoom(insertChatRoom: InsertChatRoom): Promise<ChatRoom> {
    const id = this.currentChatRoomId++;
    const now = new Date();
    const chatRoom: ChatRoom = { ...insertChatRoom, id, createdAt: now };
    this.chatRooms.set(id, chatRoom);
    return chatRoom;
  }
  
  async getChatMessages(chatRoomId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.chatRoomId === chatRoomId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    try {
      // First get all chat rooms where the user is a participant
      const userRooms = await this.getChatRoomsByUserId(userId);
      
      // If user has no chat rooms, return 0
      if (!userRooms || userRooms.length === 0) {
        return 0;
      }
      
      // Then count unread messages in those rooms where the user is not the sender
      let count = 0;
      for (const room of userRooms) {
        const messages = Array.from(this.chatMessages.values())
          .filter(msg => 
            msg.chatRoomId === room.id && 
            msg.senderId !== userId && 
            !msg.isRead
          );
        count += messages.length;
      }
      
      return count;
    } catch (error) {
      console.error("읽지 않은 메시지 수 계산 중 오류:", error);
      // 오류 발생 시에도 0을 반환하여 앱 동작에 영향 없도록 함
      return 0;
    }
  }
  
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const now = new Date();
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      isRead: false,
      createdAt: now 
    };
    this.chatMessages.set(id, message);
    return message;
  }
  
  async markMessagesAsRead(chatRoomId: number, userId: number): Promise<void> {
    for (const [id, message] of this.chatMessages.entries()) {
      if (message.chatRoomId === chatRoomId && message.senderId !== userId) {
        this.chatMessages.set(id, { ...message, isRead: true });
      }
    }
  }
  
  // Comment methods
  async getCommentsByProductId(productId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.productId === productId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const now = new Date();
    const comment: Comment = { ...insertComment, id, createdAt: now };
    this.comments.set(id, comment);
    return comment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
  
  // Report methods
  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const now = new Date();
    const report: Report = { ...insertReport, id, createdAt: now };
    this.reports.set(id, report);
    return report;
  }
  
  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }
  
  async updateReport(id: number, reportData: Partial<Report>): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const updatedReport = { ...report, ...reportData };
    this.reports.set(id, updatedReport);
    
    return updatedReport;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    // 1. 사용자가 작성한 모든 상품 삭제
    const userProducts = await this.getProductsBySellerId(id);
    for (const product of userProducts) {
      await this.deleteProduct(product.id);
    }
    
    // 2. 사용자가 참여한 모든 채팅방 및 채팅 메시지 삭제
    const userChatRooms = await this.getChatRoomsByUserId(id);
    for (const chatRoom of userChatRooms) {
      // 채팅방의 모든 메시지 삭제
      const messages = Array.from(this.chatMessages.values())
        .filter(msg => msg.chatRoomId === chatRoom.id);
      
      for (const message of messages) {
        this.chatMessages.delete(message.id);
      }
      
      // 채팅방 삭제
      this.chatRooms.delete(chatRoom.id);
    }
    
    // 3. 사용자의 모든 찜 삭제
    const userFavorites = await this.getFavoritesByUserId(id);
    for (const favorite of userFavorites) {
      this.favorites.delete(favorite.id);
    }
    
    // 4. 사용자가 작성한 모든 댓글 삭제
    const userComments = Array.from(this.comments.values())
      .filter(comment => comment.userId === id);
    
    for (const comment of userComments) {
      this.comments.delete(comment.id);
    }
    
    // 5. 사용자의 모든 신고 삭제
    const userReports = Array.from(this.reports.values())
      .filter(report => report.reporterId === id || report.reportedUserId === id);
      
    for (const report of userReports) {
      this.reports.delete(report.id);
    }
    
    // 6. 사용자의 모든 차단 정보 삭제
    const userBlocks = Array.from(this.blocks.values())
      .filter(block => block.blockerId === id || block.blockedUserId === id);
      
    for (const block of userBlocks) {
      this.blocks.delete(block.id);
    }
    
    // 7. 마지막으로 사용자 삭제
    return this.users.delete(id);
  }
  
  // Block methods
  async getBlocksByBlockerId(blockerId: number): Promise<Block[]> {
    return Array.from(this.blocks.values())
      .filter(block => block.blockerId === blockerId);
  }
  
  async createBlock(insertBlock: InsertBlock): Promise<Block> {
    const id = this.currentBlockId++;
    const now = new Date();
    const block: Block = { ...insertBlock, id, createdAt: now };
    this.blocks.set(id, block);
    return block;
  }
  
  async deleteBlock(blockerId: number, blockedUserId: number): Promise<boolean> {
    const block = Array.from(this.blocks.values())
      .find(b => b.blockerId === blockerId && b.blockedUserId === blockedUserId);
    
    if (!block) return false;
    return this.blocks.delete(block.id);
  }
  
  async isUserBlocked(blockerId: number, blockedUserId: number): Promise<boolean> {
    return !!Array.from(this.blocks.values())
      .find(block => block.blockerId === blockerId && block.blockedUserId === blockedUserId);
  }
}

export const storage = new MemStorage();
