import { WebSocketServer, WebSocket } from "ws";
import { IStorage } from "./storage";
import { insertChatMessageSchema } from "@shared/schema";

// Define WebSocket message types
type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

// Define user connections
interface UserConnection {
  userId: number;
  socket: WebSocket;
}

export function setupChatHandlers(wss: WebSocketServer, storage: IStorage) {
  // Keep track of active connections
  const connections: UserConnection[] = [];
  
  console.log("WebSocket 채팅 핸들러 설정됨");

  wss.on("connection", (ws: WebSocket, req) => {
    console.log("새로운 WebSocket 연결:", req.url);
    let userId: number | null = null;

    ws.on("message", async (data) => {
      const dataStr = typeof data === 'string' ? data : data instanceof Buffer ? data.toString() : JSON.stringify(data);
      console.log("WebSocket 메시지 수신:", dataStr.substring(0, 100)); // 로그 크기 제한
      try {
        const message: WebSocketMessage = JSON.parse(dataStr);
        console.log("메시지 타입:", message.type);

        switch (message.type) {
          case "auth":
            // Authenticate the WebSocket connection
            if (message.userId) {
              userId = parseInt(message.userId);
              
              // 중복 연결 처리: 기존 연결 제거
              const existingConnIndex = connections.findIndex(conn => conn.userId === userId);
              if (existingConnIndex !== -1) {
                console.log(`기존 WebSocket 연결 제거 (사용자 ID: ${userId})`);
                try {
                  if (connections[existingConnIndex].socket.readyState === WebSocket.OPEN) {
                    connections[existingConnIndex].socket.close();
                  }
                } catch (err) {
                  console.error(`기존 연결 종료 중 오류: ${err}`);
                }
                connections.splice(existingConnIndex, 1);
              }
              
              // Store the connection
              connections.push({ userId, socket: ws });
              console.log(`새 WebSocket 연결 등록 (사용자 ID: ${userId}), 총 연결 수: ${connections.length}`);
              
              // Notify client about successful connection
              try {
                const authSuccessMsg = JSON.stringify({
                  type: "auth_success",
                  userId,
                  timestamp: Date.now()
                });
                ws.send(authSuccessMsg);
                console.log(`인증 성공 메시지 전송 (사용자 ID: ${userId}): ${authSuccessMsg}`);
              } catch (err) {
                console.error(`인증 성공 메시지 전송 오류 (사용자 ID: ${userId}):`, err);
              }
            } else {
              ws.send(JSON.stringify({
                type: "error",
                message: "인증에 필요한 사용자 ID가 없습니다."
              }));
            }
            break;
            
          case "chat_message":
            // Handle new chat message
            if (!userId) {
              ws.send(JSON.stringify({
                type: "error",
                message: "인증이 필요합니다."
              }));
              return;
            }
            
            // Validate message data
            const { chatRoomId, message: content } = message;
            
            if (!chatRoomId || !content) {
              ws.send(JSON.stringify({
                type: "error",
                message: "메시지 데이터가 올바르지 않습니다."
              }));
              return;
            }
            
            // Get the chat room to verify sender is a participant
            const chatRoom = await storage.getChatRoom(chatRoomId);
            if (!chatRoom) {
              ws.send(JSON.stringify({
                type: "error",
                message: "채팅방을 찾을 수 없습니다."
              }));
              return;
            }
            
            // Verify user is a participant in this chat room
            if (chatRoom.buyerId !== userId && chatRoom.sellerId !== userId) {
              ws.send(JSON.stringify({
                type: "error",
                message: "이 채팅방에 참여할 권한이 없습니다."
              }));
              return;
            }
            
            // Create and save the message
            const messageData = insertChatMessageSchema.parse({
              chatRoomId,
              senderId: userId,
              message: content
            });
            
            const savedMessage = await storage.createChatMessage(messageData);
            
            // Determine recipient ID
            const recipientId = chatRoom.buyerId === userId
              ? chatRoom.sellerId
              : chatRoom.buyerId;
            
            // Send message to both the sender and recipient
            const outgoingMessage = {
              type: "new_message",
              chatRoomId,
              message: savedMessage
            };
            
            // Send to sender for confirmation
            ws.send(JSON.stringify(outgoingMessage));
            
            // Find recipient's connection and send message
            const recipientConn = connections.find(conn => conn.userId === recipientId);
            if (recipientConn && recipientConn.socket.readyState === WebSocket.OPEN) {
              recipientConn.socket.send(JSON.stringify(outgoingMessage));
            }
            break;
            
          case "mark_read":
            // Mark messages as read in a chat room
            if (!userId) {
              ws.send(JSON.stringify({
                type: "error",
                message: "인증이 필요합니다."
              }));
              return;
            }
            
            const { chatRoomId: roomId } = message;
            
            if (!roomId) {
              ws.send(JSON.stringify({
                type: "error",
                message: "채팅방 ID가 필요합니다."
              }));
              return;
            }
            
            // Mark messages as read
            await storage.markMessagesAsRead(roomId, userId);
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: "messages_marked_read",
              chatRoomId: roomId
            }));
            break;
            
          default:
            ws.send(JSON.stringify({
              type: "error",
              message: "알 수 없는 메시지 유형입니다."
            }));
            break;
        }
      } catch (error) {
        console.error("WebSocket error:", error);
        ws.send(JSON.stringify({
          type: "error",
          message: "메시지 처리 중 오류가 발생했습니다."
        }));
      }
    });

    ws.on("close", (code: number, reason: string) => {
      console.log(`WebSocket 연결 종료: 사용자 ID=${userId}, 코드=${code}, 이유=${reason || '없음'}`);
      
      // Remove the connection when socket is closed
      if (userId) {
        const index = connections.findIndex(conn => 
          conn.userId === userId && conn.socket === ws
        );
        
        if (index !== -1) {
          connections.splice(index, 1);
          console.log(`연결 제거됨: 사용자 ID=${userId}, 남은 연결 수=${connections.length}`);
        }
      }
    });
  });
}
