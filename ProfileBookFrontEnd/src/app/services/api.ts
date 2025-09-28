import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5293/api';

  constructor(private http: HttpClient) {}

getApprovedPosts(): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl}/posts/approved`,
    { headers: this.getAuthHeaders() }
  );
}
  createPost(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts`, formData);
  }

  likePost(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts/${id}/like`, {});
  }
   unlikePost(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts/${id}/unlike`, {});
  }

 commentPost(postId: number, text: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/posts/${postId}/comment`, { text }, { headers: this.getAuthHeaders() });
}

private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('token');
  return new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
}

getComments(id: number): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl}/posts/${id}/comments`
  );
}

searchUsers(query: string): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl}/profiles/search`,
    { params: { query } }
  );
}

reportUser(reportedUserId: number, reason: string) {
  return this.http.post<{ message: string }>(
    `${this.apiUrl}/reports/${reportedUserId}`,
    { reason },
    { headers: this.getAuthHeaders().set('Content-Type', 'application/json') }
  );
}


getMyProfile() {
  return this.http.get(`${this.apiUrl}/profiles/me`, {
    headers: this.getAuthHeaders()
  });
}

createProfile(profile: { fullName: string; email?: string; phone?: string; bio?: string }) {
  return this.http.post(`${this.apiUrl}/profiles`, profile, {
    headers: this.getAuthHeaders().set('Content-Type', 'application/json')
  });
}

updateMyProfile(profile: { fullName: string; email?: string; phone?: string; bio?: string }) {
  return this.http.put(`${this.apiUrl}/profiles/me`, profile, {
    headers: this.getAuthHeaders().set('Content-Type', 'application/json')
  });
}

uploadProfileImage(file: File) {
  const form = new FormData();
  form.append('image', file);
  return this.http.post(`${this.apiUrl}/profiles/me/upload-image`, form, {
    headers: this.getAuthHeaders()
  });
}


getAllReports() {
  return this.http.get<any[]>(
    `${this.apiUrl}/reports`,
    { headers: this.getAuthHeaders() } 
  );
}



getPendingPosts() {
  return this.http.get<any[]>(
    `${this.apiUrl}/posts/all`,
    { headers: this.getAuthHeaders() }
  );
}

approvePost(id: number) {
  return this.http.put(
    `${this.apiUrl}/posts/approve/${id}`, 
    {},
    { headers: this.getAuthHeaders() }
  );
}

rejectPost(id: number) {
  return this.http.put(
    `${this.apiUrl}/posts/reject/${id}`,   
    {},
    { headers: this.getAuthHeaders() }
  );
}


getUsers() {
  return this.http.get<any[]>(
    `${this.apiUrl}/users`,
    { headers: this.getAuthHeaders() }
  );
}

updateUser(id: number, payload: { username: string; role: string; newPassword?: string }) {
  return this.http.put(
    `${this.apiUrl}/users/${id}`,
    payload,
    { headers: this.getAuthHeaders() }
  );
}


deleteUser(id: number) {
  return this.http.delete(
    `${this.apiUrl}/users/${id}`,
    { headers: this.getAuthHeaders() }
  );
}



getGroups(): Observable<any> {
  return this.http.get(`${this.apiUrl}/groups`, { headers: this.getAuthHeaders() });
}

createGroup(name: string): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/groups`,
    { groupName: name },  
    {
      headers: this.getAuthHeaders().set('Content-Type', 'application/json')
    }
  );
}


addUserToGroup(groupId: number, userId: number): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/groups/${groupId}/add/${userId}`,
    {},
    { headers: this.getAuthHeaders() }
  );
}

removeUserFromGroup(groupId: number, userId: number): Observable<any> {
  return this.http.delete(
    `${this.apiUrl}/groups/${groupId}/remove/${userId}`,
    { headers: this.getAuthHeaders() }
  );
}

getUserProfile(userId: number) {
  return this.http.get(`${this.apiUrl}/profiles/${userId}`, {
    headers: this.getAuthHeaders()
  });
}
// In your api.service.ts, add these methods if they don't exist:

getMessageHistory(userId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/messages/history/${userId}`, {
    headers: this.getAuthHeaders()
  });
}

getMessagesWith(userId: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/messages/with/${userId}`, {
    headers: this.getAuthHeaders()
  });
}

sendMessage(receiverId: number, content: string): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/messages/send`, {
    receiverId,
    content
  }, {
    headers: this.getAuthHeaders()
  });
}
}
