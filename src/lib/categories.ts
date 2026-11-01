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
  /** Hub introduction paragraphs (plain text). */
  about: string[];
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
    about: [
      'Money decisions are mostly about the same few things: how much a loan really costs, how fast savings grow, and what you actually take home. These calculators answer those questions with the same formulas lenders and planners use, and show every step.',
      'Where a current rate matters, the default comes from published data (Freddie Mac mortgage rates, Federal Reserve consumer credit rates, Treasury yields and the Consumer Price Index), with its source and date shown next to the field. Paycheck results use the 2026 IRS brackets and standard deduction.',
    ],
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
    about: [
      'These calculators use the equations clinicians and researchers rely on: the CDC’s BMI categories, the Mifflin-St Jeor equation for calorie needs, the US Navy tape method for body fat and the classic ideal body weight formulas. Each page names its formula and cites the original source.',
      'Every result is an estimate for adults and a starting point for a conversation with a doctor or registered dietitian, not a diagnosis. Switch between pounds and kilograms at any time; your entries convert automatically.',
    ],
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
    about: [
      'Fast answers are only half the job: these calculators show the working, so you can check homework, follow a method or catch a typo. Fractions are simplified step by step, standard deviation comes with a full deviations table, and the scientific calculator shows exactly how it read your expression.',
      'Arithmetic is exact wherever possible. Fractions use whole-number math, and percentages and statistics use decimal arithmetic, so results like 0.1 + 0.2 come out as 0.3.',
    ],
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
    about: [
      'Quick answers for questions that come up every week: how old someone is to the day, how many days or business days until a deadline, and what a semester of grades adds up to.',
      'Date math follows the calendar exactly, including leap years and months of different lengths, and business-day counts can skip US federal holidays using their observed dates.',
    ],
  },
};

export const categoryOrder: Category[] = ['finance', 'health', 'math', 'everyday'];
