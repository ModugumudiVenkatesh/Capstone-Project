import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPostsApproveComponent } from './posts-approve';

describe('AdminPostsApproveComponent', () => {
  let component: AdminPostsApproveComponent;
  let fixture: ComponentFixture<AdminPostsApproveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPostsApproveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPostsApproveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
