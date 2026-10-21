import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFormStore } from '@/stores/forms';
import type { AdhesionAssoData, AdhesionIndivData, VolunteerFormData } from '@/types';

const validContact = {
  name: 'Jean Dupont',
  email: 'jean@test.fr',
  subject: 'Test',
  message: 'Hello',
};

const validVolunteer: VolunteerFormData = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean@test.fr',
  phone: '0600000000',
  birthDate: '2000-01-01',
  city: 'Toulouse',
  interests: ['Événementiel'],
  availability: ['jour'],
  motivations: 'Aider',
  skills: ['tech'],
  languages: 'Français',
  hasDrivingLicence: true,
  hasVehicle: false,
  pastExperience: 'Bénévole 2023',
  acceptCgu: true,
};

const validAdhesionIndiv: AdhesionIndivData = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean@test.fr',
  phone: '0600000000',
  address: '1 rue Test',
  birthDate: '2000-01-01',
  contribution: 'libre',
  amount: '25',
  paymentMethod: 'cb',
  acceptCgu: true,
};

const validAdhesionAsso: AdhesionAssoData = {
  name: 'Asso Test',
  siret: '12345678901234',
  repFirstName: 'Jean',
  repLastName: 'Dupont',
  repEmail: 'jean@test.fr',
  address: '1 rue Test',
  description: 'Une description suffisamment longue pour le schema.',
  website: 'https://asso.test',
  discord: '',
  games: ['League of Legends'],
  membersCount: 10,
  logo: '',
  acceptCgu: true,
};

describe('useFormStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('submitContact valide, persiste puis réinitialise le formulaire', async () => {
    const store = useFormStore();
    const result = await store.submitContact(validContact);
    expect(result).toBe(true);
    expect(store.contactState.success).toBe(true);
    expect(store.contactState.error).toBeNull();
    expect(store.contact.name).toBe(''); // réinitialisé après envoi
    const stored = JSON.parse(localStorage.getItem('tec_contacts') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject(validContact);
    expect(stored[0].submittedAt).toBeTruthy();
  });

  it('submitContact rejette un email invalide sans persister', async () => {
    const store = useFormStore();
    const result = await store.submitContact({ ...validContact, email: 'invalid' });
    expect(result).toBe(false);
    expect(store.contactState.error).toContain('email valide');
    expect(store.contactState.submitting).toBe(false);
    expect(localStorage.getItem('tec_contacts')).toBeNull();
  });

  it('submitContact valide sans payload (utilise l’état du store)', async () => {
    const store = useFormStore();
    Object.assign(store.contact, validContact);
    await expect(store.submitContact()).resolves.toBe(true);
  });

  it('submitContact signale un stockage local indisponible', async () => {
    const store = useFormStore();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const result = await store.submitContact(validContact);
    expect(result).toBe(false);
    expect(store.contactState.error).toContain('stockage local indisponible');
  });

  it('submitVolunteer valide le schema complet et persiste', async () => {
    const store = useFormStore();
    const result = await store.submitVolunteer(validVolunteer);
    expect(result).toBe(true);
    expect(store.volunteerState.success).toBe(true);
    const stored = JSON.parse(localStorage.getItem('tec_volunteers') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ firstName: 'Jean', acceptCgu: true });
    expect(store.volunteer.firstName).toBe(''); // réinitialisé après envoi
  });

  it('submitVolunteer rejette un payload incomplet', async () => {
    const store = useFormStore();
    const result = await store.submitVolunteer({
      ...validVolunteer,
      interests: [],
      acceptCgu: false,
    });
    expect(result).toBe(false);
    expect(store.volunteerState.error).toContain('Formulaire incomplet');
    expect(localStorage.getItem('tec_volunteers')).toBeNull();
  });

  it('submitAdhesion individu persiste avec amount si libre', async () => {
    const store = useFormStore();
    const result = await store.submitAdhesion(validAdhesionIndiv, 'indiv');
    expect(result).toBe(true);
    expect(store.adhesionState.success).toBe(true);
    const stored = JSON.parse(localStorage.getItem('tec_adhesions') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].amount).toBe('25');
    expect(stored[0].kind).toBe('indiv');
    expect(store.adhesionIndiv.firstName).toBe(''); // réinitialisé après envoi
  });

  it('submitAdhesion structure persiste', async () => {
    const store = useFormStore();
    const result = await store.submitAdhesion(validAdhesionAsso, 'asso');
    expect(result).toBe(true);
    const stored = JSON.parse(localStorage.getItem('tec_adhesions') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].kind).toBe('asso');
    expect(stored[0].name).toBe('Asso Test');
  });

  it('submitAdhesion rejette une structure sans adresse', async () => {
    const store = useFormStore();
    const result = await store.submitAdhesion({ ...validAdhesionAsso, address: '' }, 'asso');
    expect(result).toBe(false);
    expect(store.adhesionState.error).toContain('Formulaire incomplet');
    expect(localStorage.getItem('tec_adhesions')).toBeNull();
  });

  it('les actions reset réinitialisent formulaires et états', async () => {
    const store = useFormStore();
    await store.submitContact(validContact);
    store.contactState.error = 'x';
    store.resetContact();
    expect(store.contact.email).toBe('');
    expect(store.contactState.error).toBeNull();

    Object.assign(store.volunteer, validVolunteer);
    store.volunteerState.error = 'x';
    store.resetVolunteer();
    expect(store.volunteer.firstName).toBe('');
    expect(store.volunteer.interests).toHaveLength(0);
    expect(store.volunteerState.error).toBeNull();

    store.adhesionIndiv.firstName = 'Jean';
    store.resetAdhesionIndiv();
    expect(store.adhesionIndiv.firstName).toBe('');

    store.adhesionAsso.name = 'Asso';
    store.resetAdhesionAsso();
    expect(store.adhesionAsso.name).toBe('');
    expect(store.adhesionAsso.games).toHaveLength(0);

    store.adhesionState.error = 'x';
    store.resetAdhesion();
    expect(store.adhesionState.error).toBeNull();
  });

  it('isValidEmail valide une adresse pragmatique', () => {
    const store = useFormStore();
    expect(store.isValidEmail('a@b.fr')).toBe(true);
    expect(store.isValidEmail('a@b')).toBe(false);
    expect(store.isValidEmail(' invalid@b.fr')).toBe(false);
  });
});
