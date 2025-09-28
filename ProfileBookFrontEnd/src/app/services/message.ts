import * as signalR from '@microsoft/signalr';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { ApiService } from './api';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private baseUrl = 'http://localhost:5293/api/messages'; 
  private hubUrl = 'http://localhost:5293/chathub';

  private hubConnection: signalR.HubConnection | undefined;
  private messageReceived = new Subject<{ sender: string, content: string, senderId: number, timestamp: Date }>();
  messageReceived$ = this.messageReceived.asObservable();

  constructor(private http: HttpClient, private api: ApiService) {}

  startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, { 
        accessTokenFactory: () => localStorage.getItem('token') || '',
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR connection established'))
      .catch(err => console.error('SignalR connection error:', err));

    this.hubConnection.on('ReceiveMessage', (sender: string, content: string, senderId: number, timestamp: Date) => {
      console.log('Message received:', { sender, content, senderId, timestamp });
      this.messageReceived.next({ sender, content, senderId, timestamp });
    });

    this.hubConnection.onclose((error) => {
      console.error('SignalR connection closed:', error);
    });
  }

  getMessages(receiverId: number): Observable<any> {
    if (!receiverId) {
      return throwError(() => new Error('Receiver ID is required'));
    }
    return this.http.get(`${this.baseUrl}/with/${receiverId}`, {
      headers: this.getAuthHeaders()
    });
  }

  sendMessage(receiverId: number, content: string): Observable<any> {
    if (!receiverId) {
      return throwError(() => new Error('Receiver ID is required'));
    }
    
    // CHANGE: Send to /api/messages (not /api/messages/send)
    return this.http.post(`${this.baseUrl}`, {
      receiverId,
      content
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}