import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorpsCompenent } from './corps.component';

describe('CorpsComponent', () => {
  let component: CorpsCompenent;
  let fixture: ComponentFixture<CorpsCompenent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorpsCompenent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CorpsCompenent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
