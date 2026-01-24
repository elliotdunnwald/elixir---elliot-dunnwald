
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * AI services have been disabled for simplicity.
 * All entries are now manual to maintain the pure social logging experience.
 */

export const getLocationSuggestions = async (query: string) => [];
export const getFarmMetadata = async (farmName: string, country: string) => ({ varietals: [], processes: [] });
export const searchCafesWithMaps = async (query: string, lat?: number, lng?: number) => [];
export const analyzeCoffeeBagImage = async (base64Image: string) => null;
export const getCoffeeLotDetails = async (coffeeName: string, origin: string) => null;
export const getRoasterOfferings = async (roasterName: string) => ({ singleOrigins: [], blends: [], sources: [] });
export const searchRoaster = async (query: string) => [];
export const searchCoffeeMatches = async (query: string) => [];
export const searchClubs = async (query: string) => [];
