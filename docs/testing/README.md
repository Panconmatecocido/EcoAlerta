# 🧪 EcoAlerta — Documentación Integral de Testing & Calidad de Software

> **Cátedra:** Testing & Calidad de Software — Año Lectivo 2026  
> **Universidad:** Universidad Nacional de Pilar (UNPilar)  
> **Profesor Titular:** Mg. Pedro Brest  
> **Alumno / Lead QA & Delivery Lead:** Raul Escobar (DNI: 37.769.126)  
> **Proyecto Evaluado:** EcoAlerta (Aplicación Móvil React Native + Backend Express/TypeScript + PostgreSQL/Prisma)  
> **Metodología y Estándares:** IEEE 829 / ISO/IEC/IEEE 29119, ISO/IEC 25010, Spec-Driven Testing (SDD) y PMBOK (PERT-CPM).

---

## 🧭 Índice de Instrumentos y Entregables

La documentación de aseguramiento de calidad del proyecto EcoAlerta ha sido estructurada de forma modular, auditable y sin ambigüedades, cubriendo desde la especificación de requisitos hasta la certificación final del producto:

| Orden | Documento / Artefacto | Descripción del Contenido | Enlace Directo |
| :---: | :--- | :--- | :---: |
| **01** | **Plan Maestro de Pruebas (IEEE 829 / ISO 29119)** | Alcance, objetivos, entornos de prueba, criterios de entrada/suspensión/salida, tipos de prueba, severidades de defectos (S1 a S4) y ciclo de vida del bug. | [📄 01_PLAN_DE_TESTING_ECOALERTA.md](01_PLAN_DE_TESTING_ECOALERTA.md) |
| **02** | **Catálogo de HU, Requisitos y BDD** | 15 Historias de Usuario, Requisitos Funcionales desglosados, tablas de validación exhaustivas (regex, longitud, tipo, mensajes de error) y escenarios en Gherkin BDD. | [📄 02_CATALOGO_HU_RF_CRITERIOS_BDD.md](02_CATALOGO_HU_RF_CRITERIOS_BDD.md) |
| **03** | **Matriz de Trazabilidad de Requisitos (RTM)** | Mapeo bidireccional exhaustivo: HU $\leftrightarrow$ RF $\leftrightarrow$ Casos de Prueba $\leftrightarrow$ Ejecución $\leftrightarrow$ Bugs $\leftrightarrow$ Rol Desarrollador Responsable. | [📄 03_MATRIZ_DE_TRAZABILIDAD_RTM.md](03_MATRIZ_DE_TRAZABILIDAD_RTM.md) |
| **04** | **Casos de Prueba Detallados** | 57 Casos de Prueba con precondiciones, pasos reproducibles, payloads JSON de entrada, resultados esperados en interfaz (UI) y base de datos (DB). | [📄 04_CASOS_DE_PRUEBA_DETALLADOS.md](04_CASOS_DE_PRUEBA_DETALLADOS.md) |
| **05** | **Planilla de Ejecución y Bitácora de Bugs** | Registro de corridas de prueba, tasa de aprobación, bitácora de defectos detectados (`BUG-101`, `BUG-102`), trazabilidad de fix y re-test. | [📄 05_PLANILLA_EJECUCION_Y_PROGRESO.md](05_PLANILLA_EJECUCION_Y_PROGRESO.md) |
| **06** | **Cronograma Gantt, EDT y Camino Crítico (CPM)** | Estructura EDT/WBS, 2 Diagramas Gantt en Mermaid (Macro y Micro con barras `:done` y `:active`), tablero de avance ASCII, cálculo PERT y análisis CPM. | [📄 06_CRONOGRAMA_GANTT_EDT_CPM.md](06_CRONOGRAMA_GANTT_EDT_CPM.md) |
| **07** | **Checklists de Calidad ISO/IEC 25010** | Lista de chequeo de revisión entre pares (Peer Review) y matriz de evaluación del producto bajo las 8 características de calidad de software ISO 25010. | [📄 07_CHECKLISTS_CALIDAD_ISO25010.md](07_CHECKLISTS_CALIDAD_ISO25010.md) |
| 📊 | **Libro Maestro de Testware (Excel)** | Planilla integral con 10 hojas parametrizadas con estilos corporativos: Portada, Plan, Catálogo, RTM, 57 Casos, Ejecución, Bugs, Métricas, Gantt y Checklists. | [📥 EcoAlerta_Testware_Matriz_Casos_Ejecucion.xlsx](EcoAlerta_Testware_Matriz_Casos_Ejecucion.xlsx) |
| 📅 | **Exportación Cronograma MS Project (CSV)** | Tabla estructurada de tareas, dependencias, duraciones estimadas y fechas para importar en Microsoft Project o GanttProject. | [📥 Gantt_Tareas_MSProject_EcoAlerta.csv](Gantt_Tareas_MSProject_EcoAlerta.csv) |

---

## 📊 Tablero Resumen de Calidad del Proyecto

```
========================================================================================
                      ECOALERTA — MÉTRICAS CONSOLIDADAS DE TESTING
========================================================================================
  • Historias de Usuario Analizadas:         15 HUs (100% con criterios BDD Gherkin)
  • Requisitos Funcionales Validados:         28 RFs
  • Requisitos No Funcionales (RNF):          6 RNFs (Seguridad, Concurrencia, UX, Perf)
  • Casos de Prueba Diseñados:                57 Casos (100% trazados en RTM)
  • Cobertura de Requerimientos:              100.0%
  • Defectos Detectados y Trazados:          2 Bugs (BUG-101 S3 y BUG-102 S1)
  • Defectos Corregidos y Re-testeados:       2 Bugs (100% Resueltos por Dev Responsable)
  • Defectos Críticos (S1/S2) Pendientes:     0 Abiertos
  • Estado Global de la Entrega:              🟢 APROBADO PARA CERTIFICACIÓN
========================================================================================
```

---

## 👥 Matriz de Responsabilidad por Módulo (Trazabilidad Estricta de Bugs)

Conforme a la regla de calidad establecida, cualquier defecto detectado en un módulo es asignado y corregido obligatoriamente por el desarrollador responsable del mismo:

| Módulo / Alcance | Desarrollador Responsable | Defectos Asignados | Estado de Resolución |
| :--- | :--- | :---: | :---: |
| **Módulo 1:** Autenticación, Invitado & RBAC | `Dev Módulo 1 (Auth & RBAC)` | 0 | Conforme |
| **Módulo 2A:** Reportes Ciudadanos, GPS & Fotos | `Dev Módulo 2A (Reporte Ciudadano)` | `BUG-101` (Compresión imagen Android) | ✅ Resuelto y verificado |
| **Módulo 2B:** Triaje Municipal & Agente de Campo | `Dev Módulo 2B (Triaje & Agente Campo)` | 0 | Conforme |
| **Módulo 2C:** Saneamiento & Puntos Verificados | `Dev Módulo 2C (Saneamiento & Puntos)` | 0 | Conforme |
| **Módulo 3A:** Tienda, Carrito & Checkout TTL | `Dev Módulo 3A (Tienda & Carrito)` | `BUG-102` (Race condition stock) | ✅ Resuelto y verificado |
| **Módulo 3B:** Panel Colaborador & Retiro | `Dev Módulo 3B (Colaborador & Entrega)` | 0 | Conforme |
| **Persistencia, Concurrencia & Prisma** | `Dev Backend & BD` | `BUG-102` (Soporte transaccional) | ✅ Resuelto y verificado |
| **Componentes UI y Feedback Visual** | `Dev Frontend Mobile UI/UX` | 0 | Conforme |
