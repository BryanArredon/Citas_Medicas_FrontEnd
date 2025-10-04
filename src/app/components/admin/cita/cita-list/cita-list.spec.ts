import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitaList } from './cita-list';

describe('CitaList', () => {
  let component: CitaList;
  let fixture: ComponentFixture<CitaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CitaList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitaList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
