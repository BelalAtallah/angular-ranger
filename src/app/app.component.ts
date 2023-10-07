import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  form: FormGroup;
  result = [];
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      sliderControl: [[0, 40, 80]]
    });
    this.form.valueChanges.subscribe((e)=> this.result = e)
  }
}
