# ⏱️ CRONOGRAMA DE TESTING, EDT (WBS), ESTIMACIÓN PERT Y CAMINO CRÍTICO (CPM)
## Proyecto: EcoAlerta — Aplicación Móvil de Gestión Ambiental Ciudadana y Tienda de Recompensas
**Cátedra:** Testing & Calidad de Software — UNPilar 2026  
**Profesor Titular:** Mg. Pedro Brest  
**Unidad Temática:** Unidad 6 — Planificación, Gestión del Alcance y Tiempo (PMBOK / PERT-CPM)  
**Auditor / QA Lead:** Raul Escobar (DNI: 37.769.126)  
**Versión:** 2.0 (Planificación Analítica Completa)  

---

## 1. 🌳 Estructura de Desglose del Trabajo (EDT / WBS)
Conforme a las directrices de la cátedra y las buenas prácticas del PMBOK, el alcance del esfuerzo de testing se desglosa jerárquicamente en 4 niveles de detalle:

```
Nivel 1: Proyecto EcoAlerta — Aseguramiento de Calidad y Testware
 │
 ├── Nivel 2: FASE 1 — Planificación y Análisis de Requerimientos
 │    ├── Nivel 3: Paquete 1.1: Relevamiento y Mapeo de Historias de Usuario
 │    │    ├── Actividad 1.1.1: Análisis de especificaciones de BACKLOG y HU (Act. A)
 │    │    └── Actividad 1.1.2: Definición de Criterios de Aceptación en Gherkin BDD (Act. B)
 │    └── Nivel 3: Paquete 1.2: Diseño del Plan Maestro de Testing
 │         ├── Actividad 1.2.1: Redacción del Test Plan bajo estándar IEEE 829 (Act. C)
 │         └── Actividad 1.2.2: Construcción de la Matriz de Trazabilidad RTM (Act. D)
 │
 ├── Nivel 2: FASE 2 — Diseño y Construcción del Testware
 │    ├── Nivel 3: Paquete 2.1: Especificación de Casos de Prueba
 │    │    ├── Actividad 2.1.1: Diseño de Casos M1: Autenticación, Invitado y Roles (Act. E)
 │    │    ├── Actividad 2.1.2: Diseño de Casos M2: Ciclo de Denuncias y Saneamiento (Act. F)
 │    │    └── Actividad 2.1.3: Diseño de Casos M3: Tienda, Carrito, TTL y Entrega (Act. G)
 │    └── Nivel 3: Paquete 2.2: Preparación de Datos y Entornos
 │         ├── Actividad 2.2.1: Configuración de Base de Datos y Semillas Prisma (Act. H)
 │         └── Actividad 2.2.2: Armado de Colección Postman y Fixtures Jest (Act. I)
 │
 ├── Nivel 2: FASE 3 — Ejecución de Pruebas Unitarias, Integración y API
 │    ├── Nivel 3: Paquete 3.1: Ejecución Backend y Endpoints
 │    │    ├── Actividad 3.1.1: Ejecución de Suites Unitarias y Lógica en Jest (Act. J)
 │    │    └── Actividad 3.1.2: Ejecución de API REST y Contratos en Postman (Act. K)
 │    └── Nivel 3: Paquete 3.2: Pruebas de Concurrencia y Resiliencia
 │         ├── Actividad 3.2.1: Pruebas de Toma Concurrente 1 a 1 de Agentes (Act. L)
 │         └── Actividad 3.2.2: Pruebas de Reserva Concurrente TTL en Checkout (Act. M)
 │
 ├── Nivel 2: FASE 4 — Ejecución de Pruebas UI, E2E y Experiencia de Usuario
 │    ├── Nivel 3: Paquete 4.1: Validación de Interfaz Móvil
 │    │    ├── Actividad 4.1.1: Pruebas de Modo Invitado y Auth Gate (< 100 ms) (Act. N)
 │    │    └── Actividad 4.1.2: Pruebas de TransactionLoaderModal y Spinners (Act. O)
 │    └── Nivel 3: Paquete 4.2: Flujos Completos E2E
 │         ├── Actividad 4.2.1: Recorrido E2E Reporte -> Triaje -> Verificación -> Saneamiento (Act. P)
 │         └── Actividad 4.2.2: Recorrido E2E Tienda -> Carrito -> Checkout -> Retiro (Act. Q)
 │
 └── Nivel 2: FASE 5 — Cierre, Corrección de Defectos y Dictamen Final
      ├── Nivel 3: Paquete 5.1: Ciclo de Depuración y Re-test
      │    ├── Actividad 5.1.1: Asignación y Corrección de Bugs por Dev del Módulo (Act. R)
      │    └── Actividad 5.1.2: Re-test de Confirmación y Cierre de Defectos (Act. S)
      └── Nivel 3: Paquete 5.2: Consolidación y Entrega Académica
           ├── Actividad 5.2.1: Evaluación de Checklists ISO/IEC 25010 y Peer Review (Act. T)
           └── Actividad 5.2.2: Emisión del Testware Final y Planilla de Métricas (Act. U)
```

---

## 2. 🧮 Estimación a 3 Puntos (PERT) y Varianza de Actividades

Para el cálculo de la duración estimada ($M$) y la desviación estándar ($\sigma$), se aplica la **Distribución Beta (PERT)** según la fórmula oficial de la cátedra:

$$M = \frac{a + 4b + c}{6} \qquad\qquad \sigma = \frac{c - a}{6} \qquad\qquad \sigma^2 = \left(\frac{c - a}{6}\right)^2$$

Donde:
- $a$: Tiempo optimista (días laborables).
- $b$: Tiempo más probable (días laborables).
- $c$: Tiempo pesimista (días laborables).

### Tabla de Estimaciones PERT

| ID | Actividad del Cronograma | Predecesoras | Optimista ($a$) | Más Probable ($b$) | Pesimista ($c$) | Duración Esperada ($M$) | Varianza ($\sigma^2$) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **A** | Relevamiento de BACKLOG y HU | -- | 1.0 d | 2.0 d | 3.0 d | **2.00 d** | 0.111 |
| **B** | Definición de Criterios Gherkin BDD | A | 1.5 d | 2.0 d | 3.5 d | **2.17 d** | 0.111 |
| **C** | Redacción del Plan Maestro (IEEE 829) | B | 1.0 d | 2.0 d | 3.0 d | **2.00 d** | 0.111 |
| **D** | Construcción de la Matriz RTM | C | 1.0 d | 1.5 d | 2.5 d | **1.58 d** | 0.063 |
| **E** | Diseño de Casos M1 (Auth & Roles) | D | 1.0 d | 1.5 d | 2.0 d | **1.50 d** | 0.028 |
| **F** | Diseño de Casos M2 (Denuncias y Saneamiento) | D | 2.0 d | 3.0 d | 5.0 d | **3.17 d** | 0.250 |
| **G** | Diseño de Casos M3 (Tienda, Carrito y TTL) | D | 1.5 d | 2.5 d | 4.0 d | **2.58 d** | 0.174 |
| **H** | Configuración de DB y Semillas Prisma | A | 1.0 d | 1.0 d | 2.0 d | **1.17 d** | 0.028 |
| **I** | Armado de Colección Postman y Fixtures | E, F, G, H | 1.0 d | 2.0 d | 3.0 d | **2.00 d** | 0.111 |
| **J** | Ejecución de Suites Unitarias en Jest | I | 1.0 d | 1.5 d | 2.5 d | **1.58 d** | 0.063 |
| **K** | Ejecución de API REST en Postman | I | 1.5 d | 2.0 d | 3.5 d | **2.17 d** | 0.111 |
| **L** | Pruebas de Toma Concurrente de Agentes | J, K | 1.0 d | 1.5 d | 2.0 d | **1.50 d** | 0.028 |
| **M** | Pruebas de Reserva Concurrente TTL | J, K | 1.0 d | 1.5 d | 3.0 d | **1.67 d** | 0.111 |
| **N** | Pruebas de Modo Invitado y Auth Gate | J | 0.5 d | 1.0 d | 1.5 d | **1.00 d** | 0.028 |
| **O** | Pruebas de TransactionLoaderModal | J | 0.5 d | 1.0 d | 1.5 d | **1.00 d** | 0.028 |
| **P** | Recorrido E2E Módulo Denuncias | L, N, O | 1.5 d | 2.0 d | 3.5 d | **2.17 d** | 0.111 |
| **Q** | Recorrido E2E Módulo Tienda y Retiro | M, N, O | 1.5 d | 2.0 d | 3.0 d | **2.08 d** | 0.063 |
| **R** | Corrección de Bugs por Dev Responsable | P, Q | 1.0 d | 2.0 d | 4.0 d | **2.17 d** | 0.250 |
| **S** | Re-test de Confirmación y Cierre Bugs | R | 0.5 d | 1.0 d | 1.5 d | **1.00 d** | 0.028 |
| **T** | Evaluación de Checklists ISO 25010 | S | 0.5 d | 1.0 d | 1.5 d | **1.00 d** | 0.028 |
| **U** | Emisión del Testware Final y Excel | T | 0.5 d | 1.0 d | 1.5 d | **1.00 d** | 0.028 |

---

## 3. 🎯 Cálculo del Camino Crítico (CPM) y Holguras

Para determinar el **Camino Crítico (Critical Path)**, se calculan las fechas tempranas (*Early Start* - ES, *Early Finish* - EF) mediante recorrido hacia adelante, y las fechas tardías (*Late Start* - LS, *Late Finish* - LF) mediante recorrido hacia atrás.

$$\text{Holgura Total (Total Float)} = LS - ES = LF - EF$$

### Tabla de Análisis CPM y Camino Crítico (en Días Laborables redondeados)

| Actividad | Duración ($D$) | Predecesora | Early Start (ES) | Early Finish (EF) | Late Start (LS) | Late Finish (LF) | Holgura Total ($FT$) | ¿Es Crítica? |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **A** | 2 d | -- | Día 0 | Día 2 | Día 0 | Día 2 | **0 d** | **SÍ (Crítica)** |
| **B** | 2 d | A | Día 2 | Día 4 | Día 2 | Día 4 | **0 d** | **SÍ (Crítica)** |
| **C** | 2 d | B | Día 4 | Día 6 | Día 4 | Día 6 | **0 d** | **SÍ (Crítica)** |
| **D** | 2 d | C | Día 6 | Día 8 | Día 6 | Día 8 | **0 d** | **SÍ (Crítica)** |
| **E** | 2 d | D | Día 8 | Día 10 | Día 9 | Día 11 | **1 d** | No |
| **F** | 3 d | D | Día 8 | Día 11 | Día 8 | Día 11 | **0 d** | **SÍ (Crítica)** |
| **G** | 3 d | D | Día 8 | Día 11 | Día 8 | Día 11 | **0 d** | **SÍ (Crítica)** |
| **H** | 1 d | A | Día 2 | Día 3 | Día 10 | Día 11 | **8 d** | No |
| **I** | 2 d | E, F, G, H | Día 11 | Día 13 | Día 11 | Día 13 | **0 d** | **SÍ (Crítica)** |
| **J** | 2 d | I | Día 13 | Día 15 | Día 13 | Día 15 | **0 d** | **SÍ (Crítica)** |
| **K** | 2 d | I | Día 13 | Día 15 | Día 13 | Día 15 | **0 d** | **SÍ (Crítica)** |
| **L** | 2 d | J, K | Día 15 | Día 17 | Día 15 | Día 17 | **0 d** | **SÍ (Crítica)** |
| **M** | 2 d | J, K | Día 15 | Día 17 | Día 15 | Día 17 | **0 d** | **SÍ (Crítica)** |
| **N** | 1 d | J | Día 15 | Día 16 | Día 16 | Día 17 | **1 d** | No |
| **O** | 1 d | J | Día 15 | Día 16 | Día 16 | Día 17 | **1 d** | No |
| **P** | 2 d | L, N, O | Día 17 | Día 19 | Día 17 | Día 19 | **0 d** | **SÍ (Crítica)** |
| **Q** | 2 d | M, N, O | Día 17 | Día 19 | Día 17 | Día 19 | **0 d** | **SÍ (Crítica)** |
| **R** | 2 d | P, Q | Día 19 | Día 21 | Día 19 | Día 21 | **0 d** | **SÍ (Crítica)** |
| **S** | 1 d | R | Día 21 | Día 22 | Día 21 | Día 22 | **0 d** | **SÍ (Crítica)** |
| **T** | 1 d | S | Día 22 | Día 23 | Día 22 | Día 23 | **0 d** | **SÍ (Crítica)** |
| **U** | 1 d | T | Día 23 | Día 24 | Día 23 | Día 24 | **0 d** | **SÍ (Crítica)** |

### Identificación de la Ruta Crítica
$$\text{Ruta Crítica:} \quad \mathbf{A \rightarrow B \rightarrow C \rightarrow D \rightarrow F \rightarrow I \rightarrow J/K \rightarrow L/M \rightarrow P/Q \rightarrow R \rightarrow S \rightarrow T \rightarrow U}$$

- **Duración Total del Proyecto de QA:** **24 Días Laborables** (aprox. 5 semanas).
- Cualquier retraso en las actividades de la ruta crítica demorará de forma directa la entrega final de la materia.

---

## 4. 🚦 Cronograma Gantt con Semáforos de Estado (Visualización MS Project)

Conforme a las plantillas `Semaforo-VF1.mpp` y `Plantilla semaforos.mpp` descargadas para la cátedra, cada tarea se controla mediante **Semáforos de Desempeño**:
- 🟢 **Verde:** Tarea completada al 100% o en curso sin ninguna desviación temporal.
- 🟡 **Amarillo:** Tarea en curso con riesgo menor de desviación (desvío `< 10%` o bloqueo transitorio subsanable).
- 🔴 **Rojo:** Tarea con retraso crítico que compromete la fecha de fin de la fase.

### Representación del Cronograma Gantt

```
Semanas de Trabajo:      |  Semana 1  |  Semana 2  |  Semana 3  |  Semana 4  |  Semana 5  |
Días Laborables:         | 1 2 3 4 5  | 6 7 8 9 10 | 11 12 13 14| 16 17 18 19| 21 22 23 24| Semáforo
------------------------------------------------------------------------------------------------------
Fase 1: Planificación    |            |            |            |            |            |
A: Relevamiento Backlog  | [==]       |            |            |            |            | 🟢 Completo
B: Criterios Gherkin BDD |   [==]     |            |            |            |            | 🟢 Completo
C: Plan Maestro IEEE 829 |     [==]   |            |            |            |            | 🟢 Completo
D: Matriz RTM Inicial    |       [==] |            |            |            |            | 🟢 Completo
------------------------------------------------------------------------------------------------------
Fase 2: Diseño Testware  |            |            |            |            |            |
E: Casos M1 Auth & Roles |            | [==]       |            |            |            | 🟢 Completo
F: Casos M2 Denuncias    |            | [===]      |            |            |            | 🟢 Completo
G: Casos M3 Tienda & TTL |            | [===]      |            |            |            | 🟢 Completo
H: Config DB y Semillas  |   [=]      |            |            |            |            | 🟢 Completo
I: Postman & Fixtures    |            |      [==]  |            |            |            | 🟢 Completo
------------------------------------------------------------------------------------------------------
Fase 3: Pruebas Backend  |            |            |            |            |            |
J: Tests Unitarios Jest  |            |            | [==]       |            |            | 🟢 Completo
K: Pruebas API Postman   |            |            | [==]       |            |            | 🟢 Completo
L: Concurrencia Agentes  |            |            |     [==]   |            |            | 🟢 Completo
M: Concurrencia TTL      |            |            |     [==]   |            |            | 🟢 Completo
------------------------------------------------------------------------------------------------------
Fase 4: Pruebas UI & E2E |            |            |            |            |            |
N: Modo Invitado & Auth  |            |            |     [=]    |            |            | 🟢 Completo
O: TransactionLoaderModal|            |            |     [=]    |            |            | 🟢 Completo
P: Recorrido E2E Reportes|            |            |            | [==]       |            | 🟢 Completo
Q: Recorrido E2E Tienda  |            |            |            | [==]       |            | 🟢 Completo
------------------------------------------------------------------------------------------------------
Fase 5: Cierre & Entrega |            |            |            |            |            |
R: Corrección de Bugs    |            |            |            |     [==]   |            | 🟢 Completo
S: Re-test de Defectos   |            |            |            |            | [=]        | 🟢 Completo
T: Checklist ISO 25010   |            |            |            |            |   [=]      | 🟢 Completo
U: Emisión Testware Final|            |            |            |            |     [==]   | 🟢 Completo
------------------------------------------------------------------------------------------------------
HITOS PRINCIPALES:
◆ Hito 1: Alcance y RTM Aprobados (Fin Día 8)               - Estado: 🟢 CUMPLIDO
◆ Hito 2: Testware Diseñado y Fixtures Listos (Fin Día 13)   - Estado: 🟢 CUMPLIDO
◆ Hito 3: Validación Concurrencia y API Cerrada (Fin Día 17) - Estado: 🟢 CUMPLIDO
◆ Hito 4: Ejecución E2E y Depuración Concluida (Fin Día 22)  - Estado: 🟢 CUMPLIDO
◆ Hito 5: Dictamen de Calidad y Entrega Final (Fin Día 24)   - Estado: 🟢 CUMPLIDO
```

---

## 5. ⚡ Estrategias de Compresión del Cronograma (Schedule Compression)
Conforme a las diapositivas de la Unidad 6 del profesor Mg. Pedro Brest:

1. **Ejecución Rápida (Fast-Tracking):**
   - Se solapan las actividades `E`, `F` y `G` (diseño de casos de prueba de Módulos 1, 2 y 3) ejecutándose en paralelo en lugar de secuencialmente, ahorrando 3 días laborables.
   - Las pruebas unitarias en Jest (`J`) y de API en Postman (`K`) se ejecutan en paralelo, ahorrando 2 días adicionales.
2. **Intensificación (Crashing):**
   - Ante la aparición de anomalías en concurrencia (ej. `BUG-102` en reserva de stock), se asignó de inmediato dedicación exclusiva al `Dev Backend & BD` en coordinación con el `Dev Módulo 3A (Tienda & Carrito)` para aplicar la corrección con bloqueo atómico en menos de 24 horas.
