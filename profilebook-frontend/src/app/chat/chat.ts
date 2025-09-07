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
  }

  loadMessages() {
    this.messageService.getMessages(this.receiverId).subscribe({
      next: (res: any) => this.messages = res || [],
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
          sender: 'Me',
          receiver: res.receiver || this.receiverId,
          timeStamp: new Date()
        });
        this.newMessage = '';
      },
      error: (err) => console.error('Failed to send message', err)
    });
  }
}
