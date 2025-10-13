// home.component.ts
import { Component, OnInit } from '@angular/core';
import { AreaService } from '../../services/area';
import { Area } from '../../models/area.model';

@Component({
  selector: 'app-home',
  templateUrl: './area.html',
  styleUrls: ['./area.css'],
  standalone: false
})
export class AreaComponent implements OnInit {
  areas: Area[] = [];
  filteredAreas: Area[] = [];
  loading: boolean = true;
  searchTerm: string = '';

  // Colores para cada área médica (se asignan dinámicamente)
  private areaColors: string[] = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Morado
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Rosa
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Azul claro
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Verde
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Naranja/Rosa
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Azul oscuro
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Pastel
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Rosa suave
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Durazno
    'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', // Rojo/Azul
  ];

  // Iconos según el nombre del área
  private areaIconMap: { [key: string]: string } = {
    'cardiología': 'pi pi-heart-fill',
    'pediatría': 'pi pi-users',
    'traumatología': 'pi pi-shield',
    'neurología': 'pi pi-eye',
    'dermatología': 'pi pi-sun',
    'ginecología': 'pi pi-star-fill',
    'oftalmología': 'pi pi-eye',
    'odontología': 'pi pi-verified',
    'psicología': 'pi pi-comment',
    'nutrición': 'pi pi-chart-line',
    'general': 'pi pi-plus-circle',
    'medicina general': 'pi pi-plus-circle',
    'urgencias': 'pi pi-exclamation-triangle',
    'cirugía': 'pi pi-box',
    'radiología': 'pi pi-images',
    'laboratorio': 'pi pi-flask',
  };

  constructor(private areaService: AreaService) {}

  ngOnInit(): void {
    this.loadAreas();
  }

  /**
   * Carga todas las áreas desde el backend
   */
  loadAreas(): void {
    this.loading = true;
    this.areaService.getAreas().subscribe({
      next: (data: Area[]) => {
        this.areas = data;
        this.filteredAreas = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar las áreas:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Filtra las áreas según el término de búsqueda
   */
  filterAreas(): void {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredAreas = this.areas;
      return;
    }

    this.filteredAreas = this.areas.filter(area => 
      area.nombreArea.toLowerCase().includes(term) ||
      (area.descripcion && area.descripcion.toLowerCase().includes(term))
    );
  }

  /**
   * Obtiene el color para un área específica basado en su ID
   */
  getAreaColor(idArea: number): string {
    const index = (idArea - 1) % this.areaColors.length;
    return this.areaColors[index];
  }

  /**
   * Obtiene el icono apropiado según el nombre del área
   */
  getAreaIcon(nombreArea: string): string {
    const nombre = nombreArea.toLowerCase();
    
    // Busca una coincidencia en el mapa de iconos
    for (const key in this.areaIconMap) {
      if (nombre.includes(key)) {
        return this.areaIconMap[key];
      }
    }
    
    // Icono por defecto si no hay coincidencia
    return 'pi pi-briefcase';
  }

  
}