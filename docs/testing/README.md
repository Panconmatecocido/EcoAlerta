# 🧪 EcoAlerta — Documentación Integral de Testing & Calidad de Software

> **Cátedra:** Testing & Calidad de Software — Año Lectivo 2026  
> **Universidad:** Universidad Nacional de Pilar (UNPilar)  
> **Profesor Titular:** Mg. Pedro Brest  
> **Proyecto Evaluado:** EcoAlerta (Aplicación Móvil React Native + Backend Express/TypeScript + PostgreSQL/Prisma)  
> **Fecha de Inicio Oficial:** 25 de agosto de 2026 (Creación del repositorio en GitHub)  
> **Fecha de Entrega Final:** 02 de noviembre de 2026  
> **Metodología y Estándares:** IEEE 829 / ISO/IEC/IEEE 29119, Modelo de Calidad ISO/IEC 25010 (como marco de referencia interna), Spec-Driven Testing (SDD) y PMBOK (PERT-CPM).

> [!NOTE]
> **Aclaración sobre ISO/IEC 25010**: Se adopta el estándar ISO/IEC 25010 como modelo metodológico de referencia y guía de buenas prácticas de calidad de software. No constituye una certificación externa formal.

---

## 👥 Equipo de Proyecto y Roles

El equipo está conformado por 5 integrantes con responsabilidades unívocas en el ciclo de vida de desarrollo y aseguramiento de la calidad:

| Integrante | Rol Oficial | Responsabilidad Primaria |
| :--- | :--- | :--- |
| **Escobar Raul** | **Scrum Master** | Coordinación ágil, gestión del alcance y cronograma (PMBOK), Plan Maestro de Pruebas (IEEE 829) y Matriz de Trazabilidad (RTM). |
| **Kuhn Joaquin** | **Diseñador UI/UX** | Diseño de experiencia e interfaz, componentes visuales, HomeScreen, flujos de usuario y evaluación de Usabilidad ISO/IEC 25010. |
| **Rodriguez Iván** | **Desarrollador FrontEnd** | Desarrollo de pantallas React Native (Expo), Auth Gate, módulo Ciudadano, Tienda, Modales transaccionales y resolución de bugs front (`BUG-101`). |
| **Benitez Angel** | **Desarrollador BackEnd** | API REST Node.js/Express, TypeScript, Prisma ORM, PostgreSQL, concurrencia transaccional, TTL de canjes y resolución de bugs back (`BUG-102`). |
| **Benitez Facundo** | **Analista de QA** | Diseño y ejecución de 57 casos de prueba, automatización con Jest/Supertest, colecciones Postman, reporte de bugs y pruebas de regresión. |

---

## 🧭 Índice de Instrumentos y Entregables

La documentación de aseguramiento de calidad del proyecto EcoAlerta ha sido estructurada de forma modular, auditable y sin ambigüedades, cubriendo desde la especificación de requisitos hasta la certificación final del producto:

| Orden | Documento / Artefacto | Descripción del Contenido | Enlace Directo |
| :---: | :--- | :--- | :---: |
| **01** | **Plan Maestro de Pruebas (IEEE 829 / ISO 29119)** | Alcance, objetivos, entornos de prueba, criterios de entrada/suspensión/salida, tipos de prueba, severidades de defectos (S1 a S4) y ciclo de vida del bug. | [📄 01_PLAN_DE_TESTING_ECOALERTA.md](01_PLAN_DE_TESTING_ECOALERTA.md) |
| **02** | **Catálogo de HU, Requisitos y BDD** | 15 Historias de Usuario, Requisitos Funcionales desglosados, tablas de validación exhaustivas (regex, longitud, tipo, mensajes de error) y escenarios en Gherkin BDD. | [📄 02_CATALOGO_HU_RF_CRITERIOS_BDD.md](02_CATALOGO_HU_RF_CRITERIOS_BDD.md) |
| **03** | **Matriz de Trazabilidad de Requisitos (RTM)** | Mapeo bidireccional exhaustivo: HU $\leftrightarrow$ RF $\leftrightarrow$ Casos de Prueba $\leftrightarrow$ Ejecución $\leftrightarrow$ Bugs $\leftrightarrow$ Integrante Responsable. | [📄 03_MATRIZ_DE_TRAZABILIDAD_RTM.md](03_MATRIZ_DE_TRAZABILIDAD_RTM.md) |
| **04** | **Casos de Prueba Detallados** | 57 Casos de Prueba con precondiciones, pasos reproducibles, payloads JSON de entrada, resultados esperados en interfaz (UI) y base de datos (DB). | [📄 04_CASOS_DE_PRUEBA_DETALLADOS.md](04_CASOS_DE_PRUEBA_DETALLADOS.md) |
| **05** | **Planilla de Ejecución y Bitácora de Bugs** | Registro de corridas de prueba, tasa de aprobación, bitácora de defectos detectados (`BUG-101`, `BUG-102`), trazabilidad de fix y re-test. | [📄 05_PLANILLA_EJECUCION_Y_PROGRESO.md](05_PLANILLA_EJECUCION_Y_PROGRESO.md) |
| **06** | **Cronograma Gantt, EDT y Camino Crítico (CPM)** | Estructura EDT/WBS desde el 25/08 al 02/11, 2 Diagramas Gantt en Mermaid con tareas multidía, tablero de avance ASCII, cálculo PERT y análisis CPM. | [📄 06_CRONOGRAMA_GANTT_EDT_CPM.md](06_CRONOGRAMA_GANTT_EDT_CPM.md) |
| **07** | **Checklists de Calidad Modelo ISO/IEC 25010** | Lista de chequeo de revisión entre pares (Peer Review) y matriz de evaluación del producto bajo las 8 características del modelo de calidad ISO 25010 (guía metodológica interna). | [📄 07_CHECKLISTS_CALIDAD_ISO25010.md](07_CHECKLISTS_CALIDAD_ISO25010.md) |
| **08** | **Dossier de Evidencias, Datos y Logs** | Registro auditable de pruebas en Postman (Requests, Responses, Packs de Datos), 105 tests automatizados en Jest/Node, evidencias de concurrencia y guía de captura. | [📄 08_DOSSIER_EVIDENCIAS_DE_PRUEBA.md](08_DOSSIER_EVIDENCIAS_DE_PRUEBA.md) |
| 🚀 | **Colección Oficial de Postman (JSON)** | Colección v2.1 importable con todos los endpoints de API, payloads preconfigurados y scripts de validación de contratos. | [📥 EcoAlerta_API_Postman_Collection.json](EcoAlerta_API_Postman_Collection.json) |
| ⚙️ | **Entorno de Variables Postman (JSON)** | Environment oficial con `baseUrl` local y variables de token para los 4 roles del sistema. | [📥 EcoAlerta_Environment.postman_environment.json](EcoAlerta_Environment.postman_environment.json) |
| 📊 | **Libro Maestro de Testware (Excel)** | Planilla integral con 10 hojas parametrizadas con estilos corporativos: Resumen, Casos, Jest, Postman, Pytest, Cypress, Ejecución, Trazabilidad, Requisitos y Criterios. | [📥 EcoAlerta_Testware_Matriz_Casos_Ejecucion.xlsx](EcoAlerta_Testware_Matriz_Casos_Ejecucion.xlsx) |
| 📅 | **Exportación Cronograma MS Project (CSV)** | Tabla estructurada de tareas, dependencias, duraciones estimadas y fechas para importar en Microsoft Project o GanttProject. | [📥 Gantt_Tareas_MSProject_EcoAlerta.csv](Gantt_Tareas_MSProject_EcoAlerta.csv) |

---

## 📊 Tablero Resumen de Calidad del Proyecto

```
========================================================================================
                      ECOALERTA — MÉTRICAS CONSOLIDADAS DE TESTING
========================================================================================
  • Integrantes del Equipo:                  5 Miembros (Scrum Master, UI/UX, Front, Back, QA)
  • Período Histórico del Proyecto:          25/08/2026 al 02/11/2026 (10 Semanas Calendario)
  • Historias de Usuario Analizadas:         15 HUs (100% con criterios BDD Gherkin)
  • Requisitos Funcionales Validados:         28 RFs
  • Requisitos No Funcionales (RNF):          6 RNFs (Seguridad, Concurrencia, UX, Perf)
  • Casos de Prueba Diseñados:                57 Casos (100% trazados en RTM)
  • Cobertura de Requerimientos:              100.0%
  • Defectos Detectados y Trazados:          2 Bugs (BUG-101 S3 y BUG-102 S1)
  • Defectos Corregidos y Re-testeados:       2 Bugs (100% Resueltos por Dev Responsable)
  • Defectos Críticos (S1/S2) Pendientes:     0 Abiertos
  • Estado Global de la Entrega:              🟢 APROBADO PARA CERTIFICACIÓN (02/11/2026)
========================================================================================
```

---

## 👥 Matriz de Responsabilidad por Módulo (Trazabilidad Estricta de Bugs)

Conforme a la regla de calidad establecida: **"El responsable de corregir cada defecto es unívocamente el mismo desarrollador que implementó el módulo o función"**:

| Módulo / Alcance | Desarrollador Responsable | Defectos Asignados | Estado de Resolución |
| :--- | :--- | :---: | :---: |
| **Módulo 1:** Autenticación, Invitado & RBAC | **Rodriguez Iván** (Front) / **Benitez Angel** (Back) | 0 | Conforme |
| **Módulo 2A:** Reportes Ciudadanos, GPS & Fotos | **Rodriguez Iván** (FrontEnd) / **Kuhn Joaquin** (UI/UX) | `BUG-101` (Compresión imagen Android) | ✅ Resuelto por **Rodriguez Iván** |
| **Módulo 2B:** Triaje Municipal & Agente de Campo | **Benitez Angel** (BackEnd) / **Rodriguez Iván** (FrontEnd) | 0 | Conforme |
| **Módulo 2C:** Saneamiento & Puntos Verificados | **Benitez Angel** (BackEnd) | 0 | Conforme |
| **Módulo 3A:** Tienda, Carrito & Checkout TTL | **Rodriguez Iván** (Front) / **Benitez Angel** (Back) | `BUG-102` (Race condition stock) | ✅ Resuelto por **Benitez Angel** |
| **Módulo 3B:** Panel Colaborador & Retiro | **Rodriguez Iván** (Front) / **Benitez Angel** (Back) | 0 | Conforme |
| **Persistencia, Concurrencia & Prisma** | **Benitez Angel** (Desarrollador BackEnd) | `BUG-102` (Soporte transaccional) | ✅ Resuelto por **Benitez Angel** |
| **Diseño Visual, Usabilidad & Spinners** | **Kuhn Joaquin** (Diseñador UI/UX) | 0 | Conforme |
| **Auditoría de Testware y Certificación** | **Benitez Facundo** (Analista de QA) / **Escobar Raul** (Scrum Master) | 0 | Conforme |
