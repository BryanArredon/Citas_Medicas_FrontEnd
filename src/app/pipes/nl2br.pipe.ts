import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'nl2br',
  standalone: true
})
export class Nl2brPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    
    // Convertir saltos de línea a <br>
    const html = value
      .replace(/\n/g, '<br>')
      // Convertir URLs a enlaces
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
      // Convertir bullets
      .replace(/•/g, '<span style="color: #667eea">•</span>');
    
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
