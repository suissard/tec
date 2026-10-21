import { describe, expect, it } from 'vitest';

import {
  adhesionAssoSchema,
  adhesionIndivSchema,
  validateForm,
  volunteerSchema,
} from '@/utils/validation';

describe('validation', () => {
  it('volunteerSchema valide données complètes', () => {
    const data = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@test.fr',
      phone: '0600000000',
      birthDate: '2000-01-01',
      city: 'Toulouse',
      interests: ['evenementiel'],
      availability: ['jour'],
      motivations: 'Aider',
      skills: ['tech'],
      languages: 'FR',
      hasDrivingLicence: true,
      hasVehicle: false,
      pastExperience: 'Exp',
      acceptCgu: true,
    };
    const result = validateForm(data, volunteerSchema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('volunteerSchema rejette email invalide et CGU non acceptées', () => {
    const data = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'invalid',
      phone: '',
      birthDate: '',
      city: 'Toulouse',
      interests: ['evenementiel'],
      availability: ['jour'],
      motivations: '',
      skills: [],
      languages: '',
      hasDrivingLicence: false,
      hasVehicle: false,
      pastExperience: '',
      acceptCgu: false,
    };
    const result = validateForm(data, volunteerSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('email');
    expect(result.errors).toHaveProperty('acceptCgu');
  });

  it('volunteerSchema rejette disponibilité hors enum', () => {
    const data = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@test.fr',
      phone: '',
      birthDate: '2000-01-01',
      city: 'Toulouse',
      interests: ['evenementiel'],
      availability: ['nuit'],
      motivations: '',
      skills: [],
      languages: '',
      hasDrivingLicence: false,
      hasVehicle: false,
      pastExperience: '',
      acceptCgu: true,
    };
    const result = validateForm(data, volunteerSchema);
    expect(result.valid).toBe(false);
    // Zod indexe les erreurs de tableau : chemin « availability.0 »
    expect(Object.keys(result.errors).some((key) => key.startsWith('availability'))).toBe(true);
  });

  it('adhesionIndivSchema valide contribution libre + amount ignoré hors schema', () => {
    const data = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@test.fr',
      phone: '0600000000',
      address: '1 rue',
      birthDate: '2000-01-01',
      contribution: 'libre',
      amount: '25',
      paymentMethod: 'cb',
      acceptCgu: true,
    };
    const result = validateForm(data, adhesionIndivSchema);
    expect(result.valid).toBe(true);
  });

  it('adhesionIndivSchema rejette contribution et moyen de paiement invalides', () => {
    const data = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@test.fr',
      phone: '',
      address: '1 rue',
      birthDate: '',
      contribution: '100',
      paymentMethod: 'crypto',
      acceptCgu: true,
    };
    const result = validateForm(data, adhesionIndivSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('contribution');
    expect(result.errors).toHaveProperty('paymentMethod');
  });

  it('adhesionAssoSchema exige address', () => {
    const data = {
      name: 'Asso',
      siret: '12345678901234',
      repFirstName: 'J',
      repLastName: 'D',
      repEmail: 'j@d.fr',
      description: 'Une description d’au moins vingt caractères.',
      website: '',
      discord: '',
      games: ['Lol'],
      membersCount: 10,
      logo: '',
      address: '',
      acceptCgu: true,
    };
    const result = validateForm(data, adhesionAssoSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('address');
  });

  it('adhesionAssoSchema valide un payload complet', () => {
    const data = {
      name: 'Asso',
      siret: '12345678901234',
      repFirstName: 'J',
      repLastName: 'D',
      repEmail: 'j@d.fr',
      description: 'Une description d’au moins vingt caractères.',
      website: 'https://asso.fr',
      discord: 'https://discord.gg/x',
      games: ['Lol'],
      membersCount: 10,
      logo: 'logo.png',
      address: '1 rue',
      acceptCgu: true,
    };
    const result = validateForm(data, adhesionAssoSchema);
    expect(result.valid).toBe(true);
  });

  it('adhesionAssoSchema exige un SIRET de 14 chiffres et une description >= 20', () => {
    const data = {
      name: 'Asso',
      siret: '123',
      repFirstName: 'J',
      repLastName: 'D',
      repEmail: 'j@d.fr',
      description: 'Courte',
      website: 'ftp://invalide',
      discord: '',
      games: [],
      membersCount: 0,
      logo: '',
      address: '1 rue',
      acceptCgu: false,
    };
    const result = validateForm(data, adhesionAssoSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('siret');
    expect(result.errors).toHaveProperty('description');
    expect(result.errors).toHaveProperty('website');
    expect(result.errors).toHaveProperty('games');
    expect(result.errors).toHaveProperty('membersCount');
    expect(result.errors).toHaveProperty('acceptCgu');
  });
});
