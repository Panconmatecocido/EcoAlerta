// Inicio de Fase 6 (Polish & QA): pruebas HTTP de las reglas ciudadanas de denuncias.
import express from 'express';
import request from 'supertest';
import denunciasRoutes from '../routes/denuncias.routes';

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  const mockPrisma = {
    denuncia: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  mockPrisma.$transaction.mockImplementation(
    async (operation: (transaction: typeof mockPrisma) => unknown) => operation(mockPrisma)
  );

  return {
    ...actual,
    PrismaClient: jest.fn(() => mockPrisma),
    __mockPrisma: mockPrisma,
  };
});

interface MockPrisma {
  denuncia: {
    findFirst: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    updateMany: jest.Mock;
    findUnique: jest.Mock;
  };
  user: { findFirst: jest.Mock; update: jest.Mock };
  $transaction: jest.Mock;
}

const prisma = (jest.requireMock('@prisma/client') as { __mockPrisma: MockPrisma })
  .__mockPrisma;
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use('/api/denuncias', denunciasRoutes);

const reportBase = {
  titulo: 'Microbasural en la plaza',
  descripcion: 'Residuos acumulados en la vereda.',
  categoria: 'Microbasural',
  direccion: 'Calle 1 y Calle 2',
  imagenUrl: 'https://example.test/report.jpg',
  ciudadanoId: 'citizen-1',
  municipioId: 'municipality-1',
};

describe('Citizen report endpoints', () => {
  const citizenRecord = { id: 'citizen-1', puntos: 120 };

  beforeEach(() => {
    prisma.denuncia.findFirst.mockResolvedValue(null);
    prisma.denuncia.create.mockImplementation(async ({ data }) => ({
      id: 'report-1',
      ...data,
      creadoEn: new Date().toISOString(),
    }));
    citizenRecord.puntos = 120;
    prisma.user.findFirst.mockResolvedValue(citizenRecord);
    prisma.denuncia.findMany.mockResolvedValue([]);
    prisma.denuncia.updateMany.mockResolvedValue({ count: 1 });
    prisma.denuncia.findUnique.mockResolvedValue({
      id: 'report-1',
      ciudadanoId: 'citizen-1',
      ocultarUsuario: true,
    });
  });

  it('crea con código REP secuencial, PENDIENTE y cero puntos sin modificar el saldo', async () => {
    const response = await request(app).post('/api/denuncias').send(reportBase);

    expect(response.status).toBe(201);
    expect(response.body.data.codigo).toBe(`REP-${new Date().getFullYear()}-001`);
    expect(response.body.data.estado).toBe('PENDIENTE');
    expect(response.body.data.puntosOtorgados).toBe(0);
    expect(response.body.data.direccion).toBe(reportBase.direccion);
    expect(response.body.data.latitud).toBeNull();
    expect(response.body.data.longitud).toBeNull();
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        id: reportBase.ciudadanoId,
        municipioId: reportBase.municipioId,
        rol: 'CITIZEN',
      },
      select: { id: true },
    });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(citizenRecord.puntos).toBe(120);
  });

  it('incrementa el correlativo a partir del último código existente', async () => {
    prisma.denuncia.findFirst.mockResolvedValue({
      codigo: `REP-${new Date().getFullYear()}-007`,
    });

    const response = await request(app).post('/api/denuncias').send(reportBase);

    expect(response.status).toBe(201);
    expect(response.body.data.codigo).toBe(`REP-${new Date().getFullYear()}-008`);
  });

  it('persists shared compressed photo data sent by the citizen', async () => {
    const imageData = `data:image/jpeg;base64,${'a'.repeat(160_000)}`;
    prisma.denuncia.create.mockImplementation(async ({ data }) => ({
      id: 'report-with-photo',
      ...data,
      creadoEn: new Date().toISOString(),
    }));

    const response = await request(app)
      .post('/api/denuncias')
      .send({ ...reportBase, imagenUrl: imageData })
      .expect(201);

    expect(response.body.data.imagenUrl).toBe(imageData);
  });

  it('lista solo reportes visibles del ciudadano y los ordena por fecha reciente', async () => {
    await request(app).get('/api/denuncias/ciudadano/citizen-1').expect(200);

    expect(prisma.denuncia.findMany).toHaveBeenCalledWith({
      where: { ciudadanoId: 'citizen-1', ocultarUsuario: false },
      orderBy: { creadoEn: 'desc' },
    });
  });

  it('oculta lógicamente el reporte del propietario y conserva el registro', async () => {
    const response = await request(app)
      .patch('/api/denuncias/report-1/ocultar')
      .send({ ciudadanoId: 'citizen-1' });

    expect(response.status).toBe(200);
    expect(prisma.denuncia.updateMany).toHaveBeenCalledWith({
      where: { id: 'report-1', ciudadanoId: 'citizen-1', ocultarUsuario: false },
      data: { ocultarUsuario: true },
    });
    expect(response.body.data.id).toBe('report-1');
    expect(response.body.data.ocultarUsuario).toBe(true);
    expect(prisma.denuncia.findUnique).toHaveBeenCalledWith({ where: { id: 'report-1' } });
  });

  it('rechaza ocultar un reporte que no pertenece al ciudadano indicado', async () => {
    prisma.denuncia.updateMany.mockResolvedValue({ count: 0 });

    const response = await request(app)
      .patch('/api/denuncias/report-1/ocultar')
      .send({ ciudadanoId: 'other-citizen' });

    expect(response.status).toBe(404);
    expect(prisma.denuncia.findUnique).not.toHaveBeenCalled();
  });
});
