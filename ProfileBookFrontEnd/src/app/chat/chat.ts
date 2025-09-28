import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../services/message';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent implements OnInit {
  receiverId!: number;
  messages: any[] = [];
  newMessage = '';

  constructor(private route: ActivatedRoute, private messageService: MessageService) {}

  ngOnInit(): void {
    this.receiverId = +this.route.snapshot.paramMap.get('receiverId')!;
    this.loadMessages();
    
    // Start SignalR connection
    this.messageService.startConnection();
    
    // Listen for new messages
    this.messageService.messageReceived$.subscribe((message: any) => {
      if (message.senderId === this.receiverId) {
        this.messages.push({
          id: Date.now(),
          messageContent: message.content,
          sender: message.sender,
          senderId: message.senderId,
          timeStamp: message.timestamp,
          isSent: false
        });
      }
    });
  }

  loadMessages() {
    this.messageService.getMessages(this.receiverId).subscribe({
      next: (res: any) => {
        this.messages = Array.isArray(res) ? res : [];
      },
      error: (err) => console.error('Failed to load messages', err)
    });
  }

  sendMessage() {
    const content = this.newMessage.trim();
    if (!content) return;

    this.messageService.sendMessage(this.receiverId, content).subscribe({
      next: (res: any) => {
        this.messages.push({
          id: res.id || Date.now(),
          messageContent: content,
          sender: 'You',
          senderId: this.getCurrentUserId(),
          timeStamp: new Date(),
          isSent: true
        });
        this.newMessage = '';
      },
      error: (err) => console.error('Failed to send message', err)
    });
  }

  private getCurrentUserId(): number {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id;
    }
    return 0;
  }
}