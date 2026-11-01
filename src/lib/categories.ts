import type { Category } from './types.ts';

export interface CategoryMeta {
  id: Category;
  name: string;
  /** Hub H1 */
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** One-line hub intro. */
  intro: string;
  /** Schema.org WebApplication applicationCategory. */
  appCategory: 'FinanceApplication' | 'HealthApplication' | 'EducationalApplication' | 'UtilitiesApplication';
  /** Finance and health pages carry the YMYL disclaimer. */
  ymyl: boolean;
  /** Order of sub-topic groups on the hub. */
  subtopics: string[];
}

export const categories: Record<Category, CategoryMeta> = {
  finance: {
    id: 'finance',
    name: 'Finance',
    h1: 'Finance Calculators',
    metaTitle: 'Finance Calculators: Mortgage, Loans, Savings | Calcrafty',
    metaDescription:
      'Free finance calculators for mortgages, loans, interest, retirement, debt and paychecks. Live rates, plain-English answers and step-by-step math on every page.',
    intro: 'Mortgages, loans, savings and take-home pay, with today’s rates built in and the math shown.',
    appCategory: 'FinanceApplication',
    ymyl: true,
    subtopics: ['Home buying', 'Loans and debt', 'Saving and investing', 'Income'],
  },
  health: {
    id: 'health',
    name: 'Health',
    h1: 'Health and Fitness Calculators',
    metaTitle: 'Health and Fitness Calculators: BMI, Calories | Calcrafty',
    metaDescription:
      'Free health calculators for BMI, daily calories, body fat, macros, ideal weight and running pace. Imperial or metric units, cited formulas and clear answers.',
    intro: 'Body measurements, nutrition and training, using the formulas clinicians and coaches use.',
    appCategory: 'HealthApplication',
    ymyl: true,
    subtopics: ['Body composition', 'Nutrition', 'Fitness'],
  },
  math: {
    id: 'math',
    name: 'Math',
    h1: 'Math Calculators',
    metaTitle: 'Math Calculators: Percentages, Fractions, Stats | Calcrafty',
    metaDescription:
      'Free math calculators for percentages, fractions, standard deviation and scientific functions. Every answer shows the working step by step, so you can check it.',
    intro: 'Percentages, fractions, statistics and a full scientific calculator, with the working shown.',
    appCategory: 'EducationalApplication',
    ymyl: false,
    subtopics: ['Arithmetic', 'Statistics', 'Scientific'],
  },
  everyday: {
    id: 'everyday',
    name: 'Everyday',
    h1: 'Everyday Calculators',
    metaTitle: 'Everyday Calculators: Age, Dates, GPA | Calcrafty',
    metaDescription:
      'Free everyday calculators for exact age, days between dates, business days and GPA. Instant answers as you type, shareable links and nothing to sign up for.',
    intro: 'Dates, ages and grades: the quick answers you look up every week.',
    appCategory: 'UtilitiesApplication',
    ymyl: false,
    subtopics: ['Dates and time', 'School'],
  },
};

export const categoryOrder: Category[] = ['finance', 'health', 'math', 'everyday'];
