import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitaDetail } from './cita-detail';

describe('CitaDetail', () => {
  let component: CitaDetail;
  let fixture: ComponentFixture<CitaDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CitaDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitaDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
