import * as hm from '../models/healthModel.js';

export const getVaccines = async (req, res) => res.json(await hm.getVaccines(req.query.search));
export const createVaccine = async (req, res) => res.json(await hm.createVaccine(req.body));

export const getTreatments = async (req, res) => res.json(await hm.getTreatments(req.query.search));
export const createTreatment = async (req, res) => res.json(await hm.createTreatment(req.body));

export const addHealthEvent = async (req, res) => {
  const event = await hm.addHealthEvent(req.body);
  // link vaccines/treatments if provided
  if (req.body.vaccines)
    for (const v of req.body.vaccines)
      await hm.linkVaccine(event.id, v.id, v.scheduled);
  if (req.body.treatments)
    for (const t of req.body.treatments)
      await hm.linkTreatment(event.id, t.id, t.dosage, t.duration);
  res.json(event);
};
export const getHealthEvents = async (req, res) => res.json(await hm.getHealthEvents(req.query));

export const addOutbreak = async (req, res) => res.json(await hm.addOutbreak(req.body));
export const getOutbreaks = async (req, res) => res.json(await hm.getOutbreaks(req.query));

export const getMortalityAnalysis = async (req, res) => res.json(await hm.getMortalityAnalysis(req.query));