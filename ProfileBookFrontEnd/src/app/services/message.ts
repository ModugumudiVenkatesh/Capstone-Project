import * as signalR from '@microsoft/signalr';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { ApiService } from './api';
@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private baseUrl = 'https://localhost:5293/api/messages'; 
  private hubConnection: signalR.HubConnection | undefined;
  private messageReceived = new Subject<{ sender: string, content: string }>();
  messageReceived$ = this.messageReceived.asObservable();

  constructor(private http: HttpClient, private api: ApiService) {}
startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:5293/chathub', { accessTokenFactory: () => localStorage.getItem('token') || '' })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().catch(err => console.error(err));

    this.hubConnection.on('ReceiveMessage', (sender: string, message: string) => {
      this.messageReceived.next({ sender, content: message });
    });
  }
  getMessages(receiverId: number): Observable<any> {
    return this.api.getMessagesWith(receiverId);
  }

  sendMessage(receiverId: number, content: string): Observable<any> {
    return this.api.sendMessage(receiverId, content);
  }
}