import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { MessageService } from '../../services/message';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './posts.html',
  // styleUrls: ['./posts.css'] // Ensure this file exists or adjust the path
})
export class PostsComponent implements OnInit, OnDestroy {
  posts: any[] = [];

  normalizePath(path: string | null | undefined): string {
    if (!path) return '';
    return path.replace(/\\/g, '/');
  }

  content = '';
  image: File | null = null;

  userSearch = '';
  userResults: any[] = [];
  isSearching = false;

  reportingBusyId: number | null = null;

  profile: any = null;
  profileLoading = false;

  showProfileModal = false;
  profileForm = { fullName: '', email: '', phone: '', bio: '' };
  profileImageFile: File | null = null;
  savingProfile = false;
  uploadingProfileImage = false;

  // NEW: Properties for View Profile and messaging
  selectedUser: any = null;
  showUserProfileModal = false;
  messageText: string = '';
  showMessageModal = false;
  messageHistory: any[] = [];
  messageSubscription: Subscription | null = null;

  constructor(private api: ApiService, private messageService: MessageService) { }

  ngOnInit(): void {
    this.loadPosts();
    this.loadProfile();

    // Initialize SignalR for messaging
    this.messageService.startConnection();

    // Add message listener using the new method
    this.messageSubscription = this.messageService.messageReceived$.subscribe((message: any) => {
      if (message && this.selectedUser && message.senderId == this.selectedUser.id) {
        this.messageHistory.push({
          content: message.content,
          sender: message.sender,
          senderId: message.senderId,
          timestamp: message.timestamp || new Date()
        });
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }

  loadPosts() {
    this.api.getApprovedPosts().subscribe(
      (res: any[]) => {
        this.posts = (res || []).map(p => ({
          ...p,
          newComment: '',
          comments: [],
          likeCount:
            (typeof p.likes === 'number')
              ? p.likes
              : Array.isArray(p.likes) ? p.likes.length
                : (p.likeCount ?? 0),
          _liked: false
        }));
        this.posts.forEach(p => this.loadCommentsForPost(p));
      },
      (err) => {
        console.error('Failed to load approved posts', err);
      }
    );
  }

  private loadCommentsForPost(post: any) {
    this.api.getComments(post.id).subscribe(
      (comments: any[]) => {
        post.comments = comments || [];
      },
      (err) => console.error('Failed to load comments for post', post.id, err)
    );
  }

  toggleLike(post: any) {
    if (post._liked) {
      if (post.likeCount > 0) {
        post.likeCount--;
      }

      this.api.unlikePost(post.id).subscribe({
        next: () => { post._liked = false; },
        error: (err) => {
          console.error('Unlike failed', err);
          post.likeCount++;
          post._liked = true;
        }
      });
    } else {
      post.likeCount++;

      this.api.likePost(post.id).subscribe({
        next: () => { post._liked = true; },
        error: (err) => {
          console.error('Like failed', err);
          post.likeCount = Math.max(post.likeCount - 1, 0); // rollback
          post._liked = false;
        }
      });
    }
  }

  commentPost(post: any) {
    const text = (post.newComment || '').trim();
    if (!text) return;

    this.api.commentPost(post.id, text).subscribe({
      next: (res: any) => {
        const newItem =
          res?.comment ?? { text, userName: 'You', createdAt: new Date().toISOString() };
        post.comments = post.comments || [];
        post.comments.push(newItem);
        post.newComment = '';
      },
      error: (err) => console.error('Comment failed', err)
    });
  }

  onFileSelected(event: any) {
    this.image = event.target.files[0];
  }

  createPost() {
    const formData = new FormData();
    formData.append('content', this.content);
    if (this.image) formData.append('image', this.image);

    this.api.createPost(formData).subscribe({
      next: () => {
        this.content = '';
        this.image = null;
        this.loadPosts();
      },
      error: (err) => console.error('Create post failed', err)
    });
  }

  // In your searchUsers method, ensure users have IDs
searchUsers() {
  const q = (this.userSearch || '').trim();
  if (!q) {
    this.userResults = [];
    return;
  }

  this.isSearching = true;
  this.api.searchUsers(q).subscribe({
    next: (res: any[]) => {
      // Make sure each user has an id property
      this.userResults = (res || []).map(user => ({
        ...user,
        id: user.id || user.userId || user.UserId || 0 // Handle different ID field names
      })).filter(user => user.id !== 0); // Filter out users without IDs
      
      console.log('Search results:', this.userResults);
      this.isSearching = false;
    },
    error: (err) => {
      console.error('User search failed', err);
      this.isSearching = false;
    }
  });
}

  toggleReport(u: any) {
    u._reportOpen = !u._reportOpen;
    if (u._reportOpen && !u._reason) u._reason = '';
  }

  submitReport(u: any) {
    const reason = (u._reason || '').trim();
    if (!reason) {
      alert('Please enter a reason before submitting.');
      return;
    }

    const reportedUserId = u.userId || u.UserId || u.id;
    if (!reportedUserId) {
      alert('Cannot determine user id.');
      return;
    }

    this.reportingBusyId = reportedUserId;

    this.api.reportUser(reportedUserId, reason).subscribe({
      next: (res: any) => {
        alert(res?.message || 'Reported successfully.');
        u._reportOpen = false;
        u._reason = '';
        this.reportingBusyId = null;
      },
      error: (err) => {
        console.error('Report failed', err);
        alert(err?.error?.message || 'Could not submit report. Please try again.');
        this.reportingBusyId = null;
      }
    });
  }

  toggleReportOnPost(post: any) {
    post._reportOpen = !post._reportOpen;
    if (post._reportOpen && !post._reason) post._reason = '';
  }

  submitReportForPost(post: any) {
    const reason = (post._reason || '').trim();
    if (!reason) {
      alert('Please enter a reason before submitting.');
      return;
    }

    const reportedUserId =
      post.userId || post.authorId || post.user?.id || post.author?.id;
    if (!reportedUserId) {
      alert('Cannot determine the author of this post.');
      return;
    }

    this.api.reportUser(reportedUserId, reason).subscribe({
      next: (res: any) => {
        alert(res?.message || 'Reported successfully.');
        post._reportOpen = false;
        post._reason = '';
      },
      error: (err) => {
        console.error('Report failed', err);
        alert(err?.error?.message || 'Could not submit report. Please try again.');
      }
    });
  }

  loadProfile() {
    this.profileLoading = true;
    this.api.getMyProfile().subscribe(
      (res: any) => {
        this.profile = res;
        this.profileForm = {
          fullName: res.fullName || '',
          email: res.email || '',
          phone: res.phone || '',
          bio: res.bio || ''
        };
        this.profileLoading = false;
      },
      (err) => {
        this.profile = null;
        this.profileForm = { fullName: '', email: '', phone: '', bio: '' };
        this.profileLoading = false;
      }
    );
  }

  openProfileModal() {
    this.loadProfile();
    this.profileImageFile = null;
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
    this.profileImageFile = null;
  }

  saveProfile() {
    if (!(this.profileForm.fullName || '').trim()) {
      alert('Full name is required.');
      return;
    }
    this.savingProfile = true;

    const op$ = this.profile
      ? this.api.updateMyProfile(this.profileForm)
      : this.api.createProfile(this.profileForm);

    op$.subscribe(
      (res: any) => {
        this.savingProfile = false;
        this.profile = res;
        alert('Profile saved.');

        if (this.profileImageFile) {
          this.uploadProfilePic(true);
        } else {
          this.closeProfileModal();
          this.loadProfile();
        }
      },
      (err) => {
        console.error('Save profile failed', err);
        this.savingProfile = false;
        alert('Could not save profile.');
      }
    );
  }

  onProfileImageSelected(ev: any) {
    this.profileImageFile = ev?.target?.files?.[0] || null;
  }

  uploadProfilePic(stayOpen = false) {
    if (!this.profileImageFile) {
      alert('Please choose an image.');
      return;
    }
    this.uploadingProfileImage = true;
    this.api.uploadProfileImage(this.profileImageFile).subscribe(
      (res: any) => {
        this.uploadingProfileImage = false;
        alert(res?.message || 'Profile picture uploaded!');
        this.profileImageFile = null;
        this.loadProfile();
        if (!stayOpen) this.closeProfileModal();
      },
      (err) => {
        console.error('Upload profile image failed', err);
        this.uploadingProfileImage = false;
        alert('Could not upload image.');
      }
    );
  }

  // NEW: View user profile
  viewUserProfile(user: any) {
    this.selectedUser = user;
    this.showUserProfileModal = true;

    // Load additional user details if needed
    this.api.getUserProfile(user.id).subscribe(
      (userDetails: any) => {
        this.selectedUser = { ...user, ...userDetails };
      },
      (err) => {
        console.error('Failed to load user details', err);
      }
    );
  }

  // NEW: Close profile modal
  closeUserProfileModal() {
    this.showUserProfileModal = false;
    this.selectedUser = null;
  }

  // NEW: Open message modal
  openMessageModal(user: any) {
    if (!user || user.id === undefined || user.id === null) {
      console.error('Invalid user object or missing ID:', user);
      alert('Cannot open message: User ID is missing');
      return;
    }

    console.log('Opening message modal for user ID:', user.id);

    this.selectedUser = user;
    this.showMessageModal = true;
    this.messageText = '';

    // Load message history
    this.messageService.getMessages(user.id).subscribe({
      next: (messages: any) => {
        console.log('Message history loaded:', messages);
        this.messageHistory = Array.isArray(messages) ? messages : [];
      },
      error: (err) => {
        console.error('Failed to load message history', err);
        this.messageHistory = [];
      }
    });
  }

  // NEW: Close message modal
  closeMessageModal() {
    this.showMessageModal = false;
    this.selectedUser = null;
    this.messageHistory = [];
  }

  // NEW: Send message
  sendMessage() {
    if (!this.messageText.trim()) {
      alert('Please enter a message');
      return;
    }

    if (!this.selectedUser || this.selectedUser.id === undefined || this.selectedUser.id === null) {
      console.error('No user selected or user ID missing:', this.selectedUser);
      alert('Cannot send message: No recipient selected');
      return;
    }

    console.log('Sending message to user ID:', this.selectedUser.id, 'Content:', this.messageText);

    this.messageService.sendMessage(this.selectedUser.id, this.messageText).subscribe({
      next: (res: any) => {
        console.log('Message sent successfully:', res);
        // Add the sent message to the history immediately
        this.messageHistory.push({
          content: this.messageText,
          sender: 'You',
          senderId: this.getCurrentUserId(),
          timestamp: new Date(),
          isSent: true
        });
        this.messageText = '';
      },
      error: (err) => {
        console.error('Failed to send message - full error:', err);
        if (err.error) {
          console.error('Error response:', err.error);
          alert(`Failed to send message: ${err.error}`);
        } else {
          alert('Failed to send message. Please check console for details.');
        }
      }
    });
  }

  // Add this method to get current user ID
  private getCurrentUserId(): number {
    // Try to get user ID from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Simple JWT parsing to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        return parseInt(payload.nameid || payload.sub || '0');
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }

    // Fallback: check if user data is stored elsewhere
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id || 0;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    console.warn('Could not determine current user ID');
    return 0;
  }

  // NEW: Report user from search results
  reportUser(user: any) {
    const reason = prompt('Please enter the reason for reporting this user:');
    if (!reason) return;

    const reportedUserId = user.userId || user.UserId || user.id;
    if (!reportedUserId) {
      alert('Cannot determine user id.');
      return;
    }

    this.api.reportUser(reportedUserId, reason).subscribe(
      (res: any) => {
        alert('User reported successfully.');
      },
      (err) => {
        console.error('Failed to report user', err);
        alert('Failed to report user. Please try again.');
      }
    );
  }
}