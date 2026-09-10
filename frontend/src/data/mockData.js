// Mocked data for the MVP demo. Replace with a real call to
// GET /api/vehicles/:vin/history once the backend is ready.

export const mockCar = {
  vin: 'WBA3A5C50DF123456',
  model: '2019 Skoda Octavia',
  odometer: 118400,
  firstRegistration: '11 Apr 2019',
  aiVerdict: 'safe',
  verdictText: 'Safe to Buy',
  estimatedPriceEGP: 685000,
  mileageHistory: [
    { year: 2019, km: 0 },
    { year: 2020, km: 21000 },
    { year: 2021, km: 44500 },
    { year: 2022, km: 68200 },
    { year: 2023, km: 93100 },
    { year: 2024, km: 108700 },
    { year: 2025, km: 118400 },
  ],
  timeline: [
    {
      id: 1,
      date: '14 Mar 2024',
      type: 'Routine maintenance',
      components: 'Oil filter, engine oil',
      zones: [],
      costEGP: 2400,
      aiInsight: 'Routine oil change, right on schedule. Cost is standard for the Egyptian market.',
    },
    {
      id: 2,
      date: '02 Nov 2023',
      type: 'Panel / body repair',
      components: 'Rear bumper, left rear panel',
      zones: ['rear-left', 'rear'],
      costEGP: 9800,
      aiInsight: 'Minor parking-related damage. Repair quality looks consistent with a licensed body shop, not a backyard fix.',
    },
    {
      id: 3,
      date: '19 Jun 2023',
      type: 'Electrical',
      components: 'Air conditioning compressor',
      zones: [],
      costEGP: 5200,
      aiInsight: 'Common wear item at this mileage in Egypt\u2019s climate. Nothing concerning here.',
    },
  ],
}

export const mockCarHighRisk = {
  vin: 'NLC4B7D91GH654321',
  model: '2017 Hyundai Elantra',
  odometer: 162300,
  firstRegistration: '02 Sep 2017',
  aiVerdict: 'risk',
  verdictText: 'High Risk',
  estimatedPriceEGP: 410000,
  mileageHistory: [
    { year: 2017, km: 0 },
    { year: 2018, km: 26000 },
    { year: 2019, km: 51000 },
    { year: 2020, km: 74000 },
    { year: 2021, km: 101000 },
    { year: 2022, km: 129000 },
    { year: 2023, km: 148000 },
    { year: 2024, km: 162300 },
  ],
  timeline: [
    {
      id: 1,
      date: '28 Jan 2025',
      type: 'Panel / body repair',
      components: 'Front-left fender, headlight assembly',
      zones: ['front-left', 'front'],
      costEGP: 18500,
      aiInsight: 'Significant front-corner impact. Combined with the airbag work below, this points to a real collision, not a scrape.',
    },
    {
      id: 2,
      date: '05 Sep 2024',
      type: 'Engine / transmission',
      components: 'Airbag control unit, sensor replacement',
      zones: ['front'],
      costEGP: 12300,
      aiInsight: 'Airbag system was triggered and replaced. Ask the seller directly about the accident this relates to.',
    },
    {
      id: 3,
      date: '17 Apr 2024',
      type: 'Engine / transmission',
      components: 'Oil pan gasket, oil leak repair',
      zones: [],
      costEGP: 6100,
      aiInsight: 'Leak repair at this mileage is not unusual, but worth checking again at the next service.',
    },
  ],
}

// Very small "mock backend": any VIN ending in an odd digit returns the
// high-risk demo car, everything else returns the clean one.
export function getMockCarByVin(vin) {
  const clean = (vin || '').trim()
  const lastDigitMatch = clean.match(/(\d)(?!.*\d)/)
  const lastDigit = lastDigitMatch ? parseInt(lastDigitMatch[1], 10) : 0
  const isOdd = lastDigit % 2 === 1
  const car = isOdd ? mockCarHighRisk : mockCar
  return { ...car, vin: clean || car.vin }
}
