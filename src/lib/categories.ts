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
  appCategory: 'FinanceApplication' | 'HealthApplication' | 'SportsApplication' | 'LifestyleApplication' | 'EducationalApplication' | 'UtilitiesApplication';
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
    h1: 'Health Calculators',
    metaTitle: 'Health Calculators: BMI, Calories, Body Fat | Calcrafty',
    metaDescription:
      'Free health calculators for BMI, daily calories, body fat, macros and ideal weight. Imperial or metric units, cited clinical formulas and clear answers.',
    intro: 'Body measurements and nutrition, using the formulas clinicians and dietitians use.',
    appCategory: 'HealthApplication',
    ymyl: true,
    subtopics: ['Body composition', 'Nutrition'],
    about: [
      'These calculators use the equations clinicians and researchers rely on: the CDC’s BMI categories, the Mifflin-St Jeor equation for calorie needs, the US Navy tape method for body fat and the classic ideal body weight formulas. Each page names its formula and cites the original source.',
      'Every result is an estimate for adults and a starting point for a conversation with a doctor or registered dietitian, not a diagnosis. Switch between pounds and kilograms at any time; your entries convert automatically.',
    ],
  },
  math: {
    id: 'math',
    name: 'Math',
    h1: 'Math Calculators',
    metaTitle: 'Math Calculators: Percentages, Fractions | Calcrafty',
    metaDescription:
      'Free math calculators for percentages, fractions and scientific functions. Every answer shows the working step by step, so you can follow it and check it.',
    intro: 'Percentages, fractions and a full scientific calculator, with the working shown.',
    appCategory: 'EducationalApplication',
    ymyl: false,
    subtopics: ['Arithmetic', 'Scientific'],
    about: [
      'Fast answers are only half the job: these calculators show the working, so you can check homework, follow a method or catch a typo. Fractions are simplified step by step, percentages show each operation, and the scientific calculator shows exactly how it read your expression. For averages and spread, see the statistics calculators.',
      'Arithmetic is exact wherever possible. Fractions use whole-number math and percentages use decimal arithmetic, so results like 0.1 + 0.2 come out as 0.3.',
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
  sports: {
    id: 'sports',
    name: 'Sports',
    h1: 'Sports and Fitness Calculators',
    metaTitle: 'Sports and Fitness Calculators: Pace, Training | Calcrafty',
    metaDescription:
      'Free sports and fitness calculators for running pace, race times and training. Miles or kilometers, splits for every distance and the math shown on every page.',
    intro: 'Pace, race times and training, worked out the way coaches and athletes do it.',
    appCategory: 'SportsApplication',
    ymyl: false,
    subtopics: ['Running', 'Training', 'Cycling and swimming'],
    about: [
      'These calculators turn times and distances into the numbers athletes plan with: pace per mile or kilometer, finish times for any race, and splits along the way.',
      'Results are estimates for planning training and races. Conditions, terrain and fitness on the day all change real performance, so treat them as targets rather than promises.',
    ],
  },
  statistics: {
    id: 'statistics',
    name: 'Statistics',
    h1: 'Statistics Calculators',
    metaTitle: 'Statistics Calculators: Mean, Median, SD | Calcrafty',
    metaDescription:
      'Free statistics calculators for the mean, median, mode, range, standard deviation and variance. Paste your data, get exact answers and see every step shown.',
    intro: 'Averages and spread for any list of numbers, with every step of the working shown.',
    appCategory: 'EducationalApplication',
    ymyl: false,
    subtopics: ['Descriptive statistics', 'Probability', 'Tests and intervals'],
    about: [
      'Statistics is easy to get subtly wrong. These calculators name the method they use, show each step and explain what the result does and does not tell you, such as when the median describes your data better than the mean.',
      'Paste a column straight from a spreadsheet. Arithmetic uses exact decimals, so results match textbook answers instead of drifting with floating-point rounding.',
    ],
  },
  physics: {
    id: 'physics',
    name: 'Physics',
    h1: 'Physics Calculators',
    metaTitle: 'Physics Calculators: Motion, Energy, Power | Calcrafty',
    metaDescription:
      'Free physics calculators for speed, acceleration, force, energy, power and electricity. Any unit you like, standard formulas and each step of the working shown.',
    intro: 'Motion, forces, energy and electricity, with units handled for you and the formulas shown.',
    appCategory: 'EducationalApplication',
    ymyl: false,
    subtopics: ['Motion', 'Energy and power', 'Electricity'],
    about: [
      'These calculators use the standard formulas from introductory physics, name each one, and convert units automatically so you can mix meters, feet, seconds and hours.',
      'Every page shows the formula with your numbers substituted, which makes them useful for checking homework as well as for quick answers.',
    ],
  },
  chemistry: {
    id: 'chemistry',
    name: 'Chemistry',
    h1: 'Chemistry Calculators',
    metaTitle: 'Chemistry Calculators: Moles, Molarity, Gases | Calcrafty',
    metaDescription:
      'Free chemistry calculators for moles, molar mass, molarity, dilutions and gas laws. Standard atomic weights, unit conversion and each step of the working shown.',
    intro: 'Moles, solutions and gas laws, using standard atomic weights and showing every step.',
    appCategory: 'EducationalApplication',
    ymyl: false,
    subtopics: ['Stoichiometry', 'Solutions', 'Gases'],
    about: [
      'These calculators follow the methods taught in general chemistry: they name the equation, convert units and show each step so you can follow or check the working.',
      'Atomic weights and constants come from published standard values, cited on each page.',
    ],
  },
  biology: {
    id: 'biology',
    name: 'Biology',
    h1: 'Biology Calculators',
    metaTitle: 'Biology Calculators: Genetics, Growth | Calcrafty',
    metaDescription:
      'Free biology calculators for genetics, population growth, cell dilutions and lab work. Clear explanations, cited methods and every step of the working shown.',
    intro: 'Genetics, growth and lab calculations, explained step by step.',
    appCategory: 'EducationalApplication',
    ymyl: false,
    subtopics: ['Genetics', 'Cells and growth', 'Lab calculations'],
    about: [
      'These calculators cover the quantitative side of biology, from inheritance ratios to growth rates and lab dilutions, and explain the method behind each result.',
      'Each page cites the method it uses and shows the working, so it can support coursework and lab prep.',
    ],
  },
  ecology: {
    id: 'ecology',
    name: 'Ecology',
    h1: 'Ecology and Environment Calculators',
    metaTitle: 'Ecology Calculators: Carbon Footprint, Energy | Calcrafty',
    metaDescription:
      'Free ecology and environment calculators for carbon footprint, energy and water use, and emissions. Published emission factors, sources and the math shown.',
    intro: 'Carbon, energy and water: how everyday choices add up, using published emission factors.',
    appCategory: 'EducationalApplication',
    ymyl: false,
    subtopics: ['Carbon footprint', 'Energy and water', 'Populations'],
    about: [
      'These calculators estimate the environmental impact of everyday activities using published emission and consumption factors, and name the source of each one.',
      'Estimates depend on assumptions such as your local electricity mix, so each page shows the factor it used and lets you see how the result was built.',
    ],
  },
  construction: {
    id: 'construction',
    name: 'Construction',
    h1: 'Construction Calculators',
    metaTitle: 'Construction Calculators: Concrete, Flooring | Calcrafty',
    metaDescription:
      'Free construction calculators for concrete, flooring, paint, roofing and lumber. Quantities with waste allowances, in feet or meters, with the math shown.',
    intro: 'Materials and quantities for building and home projects, with waste allowances included.',
    appCategory: 'UtilitiesApplication',
    ymyl: false,
    subtopics: ['Materials', 'Area and volume', 'Roofing and framing'],
    about: [
      'These calculators work out how much material a project needs, from cubic yards of concrete to gallons of paint, and add the waste allowance contractors use.',
      'Quantities are estimates for planning and ordering. Check local building codes and product specifications before you buy or build.',
    ],
  },
  conversion: {
    id: 'conversion',
    name: 'Conversion',
    h1: 'Unit Conversion Calculators',
    metaTitle: 'Unit Converters: Length, Weight, Temperature | Calcrafty',
    metaDescription:
      'Free unit converters for length, weight, volume, temperature, area, speed and data. Exact conversion factors, instant results and a clear table for every unit.',
    intro: 'Length, weight, volume, temperature and more, using exact conversion factors.',
    appCategory: 'UtilitiesApplication',
    ymyl: false,
    subtopics: ['Length and area', 'Weight and volume', 'Temperature and energy', 'Speed, data and time'],
    about: [
      'These converters use exact defined factors wherever they exist, such as 1 inch = 2.54 centimeters and 1 pound = 0.45359237 kilograms, so results are as precise as the inputs.',
      'Each converter shows the factor it used and a table of common values for quick reference.',
    ],
  },
  food: {
    id: 'food',
    name: 'Food',
    h1: 'Food and Cooking Calculators',
    metaTitle: 'Food and Cooking Calculators: Recipes, Portions | Calcrafty',
    metaDescription:
      'Free food and cooking calculators for scaling recipes, converting cups to grams, portion sizes and cooking times. Instant answers for the kitchen, math shown.',
    intro: 'Recipe scaling, kitchen conversions and portions: quick answers while you cook.',
    appCategory: 'LifestyleApplication',
    ymyl: false,
    subtopics: ['Cooking', 'Recipes and portions', 'Drinks'],
    about: [
      'These calculators handle the arithmetic of the kitchen: scaling a recipe, converting between cups and grams, and planning how much food to make.',
      'Ingredient conversions depend on density, so each page states the values it uses. For nutrition and calorie needs, see the health calculators.',
    ],
  },
  other: {
    id: 'other',
    name: 'Other',
    h1: 'Other Calculators',
    metaTitle: 'Other Calculators: Useful Tools | Calcrafty',
    metaDescription:
      'Useful calculators that do not fit a single category: quick tools for everyday questions, each with a plain-English answer and the working shown step by step.',
    intro: 'Useful tools that do not fit neatly anywhere else.',
    appCategory: 'UtilitiesApplication',
    ymyl: false,
    subtopics: ['Miscellaneous'],
    about: [
      'Some questions do not belong to one subject. These calculators answer them with the same care as the rest of the site: a clear method, the working shown and sources where they matter.',
      'If a calculator here grows into a group, it moves to a category of its own.',
    ],
  },
};

/** Display order. Categories with no calculators yet are hidden everywhere (see liveCategories in registry.ts). */
export const categoryOrder: Category[] = [
  'finance',
  'health',
  'sports',
  'math',
  'statistics',
  'physics',
  'chemistry',
  'biology',
  'ecology',
  'construction',
  'conversion',
  'food',
  'everyday',
  'other',
];
