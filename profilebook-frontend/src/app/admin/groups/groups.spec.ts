import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGroupsComponent } from './groups';

describe('AdminGroupsComponent', () => {
  let component: AdminGroupsComponent;
  let fixture: ComponentFixture<AdminGroupsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminGroupsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
