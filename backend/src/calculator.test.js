import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./models/Crop.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('./models/Fertilizer.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import Crop from './models/Crop.js';
import Fertilizer from './models/Fertilizer.js';
import { calculateRequirements } from './calculator.js';

describe('calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates nutrient requirements and totals for a selected crop and fertilizer', async () => {
    Crop.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        cropId: 'maize',
        name: 'Maize',
        npk: { n: 100, p: 50, k: 50 },
      }),
    });

    Fertilizer.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        fertilizerId: 'urea',
        name: 'Urea',
        n: 46,
        p: 0,
        k: 0,
        bagWeight: 50,
        price: 100,
      }),
    });

    const result = await calculateRequirements({
      crop: 'maize',
      fieldArea: 1,
      areaUnit: 'acre',
      selectedFertilizers: [{ id: 'urea' }],
    });

    expect(result.nutrients.required.n).toBeCloseTo(40.47, 2);
    expect(result.fertilizerDetails[0].quantityNeeded).toBeGreaterThan(0);
    expect(result.fertilizerDetails[0].bagsNeeded).toBeGreaterThan(0);
    expect(result.fertilizerDetails[0].cost).toBeGreaterThan(0);
  });

  it('throws when the requested crop cannot be resolved', async () => {
    Crop.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    await expect(calculateRequirements({ crop: 'unknown' })).rejects.toThrow('Invalid or missing crop.');
  });
});
