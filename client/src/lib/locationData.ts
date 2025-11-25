// Location data using country-state-city package
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city'

// Get all countries
export function getAllCountries(): ICountry[] {
  return Country.getAllCountries()
}

// Get country by code
export function getCountryByCode(countryCode: string): ICountry | undefined {
  return Country.getCountryByCode(countryCode)
}

// Get states of a country by country code
export function getStatesByCountryCode(countryCode: string): IState[] {
  return State.getStatesOfCountry(countryCode)
}

// Get cities of a state by country code and state code
export function getCitiesByStateCode(countryCode: string, stateCode: string): ICity[] {
  return City.getCitiesOfState(countryCode, stateCode)
}

// Helper: Get country code from country name
export function getCountryCodeFromName(countryName: string): string | null {
  const country = Country.getAllCountries().find(c => c.name === countryName)
  return country?.isoCode || null
}

// Helper: Get state code from state name and country code
export function getStateCodeFromName(stateName: string, countryCode: string): string | null {
  const states = State.getStatesOfCountry(countryCode)
  const state = states.find(s => s.name === stateName)
  return state?.isoCode || null
}

// Export types for convenience
export type { ICountry, IState, ICity }

