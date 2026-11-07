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
    subtopics: ['Home buying', 'Loans and debt', 'Saving and investing', 'Income', 'Business'],
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
      'Free math calculators for percentages, discounts, fractions, the Pythagorean theorem and scientific functions, with the working shown step by step.',
    intro: 'Percentages, discounts, fractions, right triangles and a full scientific calculator, with the working shown.',
    appCategory: 'EducationalApplication',
    ymyl: false,
    subtopics: ['Arithmetic', 'Geometry', 'Scientific'],
    about: [
      'Fast answers are only half the job: these calculators show the working, so you can check homework, follow a method or catch a typo. Fractions are simplified step by step, percentages show each operation, and the scientific calculator shows exactly how it read your expression. For averages and spread, see the statistics calculators.',
      'Arithmetic is exact wherever possible. Fractions use whole-number math and percentages use decimal arithmetic, so results like 0.1 + 0.2 come out as 0.3.',
      'The discount calculator handles stacked coupons and sales tax, and the Pythagorean theorem calculator solves any side of a right triangle, with the exact square-root form, the angles, the area and the perimeter.',
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
    metaTitle: 'Physics Calculators: Ohm’s Law, Volts, Amps | Calcrafty',
    metaDescription:
      'Free physics calculators: volts, amps, ohms and watts with Ohm’s law, and what any appliance costs to run in kWh and dollars, with every step shown.',
    intro: 'Electricity worked out step by step: volts, amps, ohms and watts, and what your appliances cost to run.',
    appCategory: 'EducationalApplication',
    ymyl: false,
    subtopics: ['Motion', 'Energy and power', 'Electricity'],
    about: [
      'These calculators use the standard formulas from introductory physics, name each one, and show the working with your numbers substituted, so they’re useful for checking homework as well as for quick answers.',
      'The Ohm’s law calculator covers voltage, current, resistance and power, and the electricity cost calculator turns an appliance’s watts into kilowatt-hours and dollars at the U.S. average electricity price or your own rate. Remember that household voltages are dangerous: use the results for planning and understanding, and leave wiring to a licensed electrician.',
    ],
  },
  chemistry: {
    id: 'chemistry',
    name: 'Chemistry',
    h1: 'Chemistry Calculators',
    metaTitle: 'Chemistry Calculators: Molarity and Solutions | Calcrafty',
    metaDescription:
      'Free chemistry calculators: molarity, moles, grams to weigh out and volumes to make up, with molar masses of common compounds built in from atomic weights.',
    intro: 'Solution concentrations worked out step by step, with standard atomic weights built in.',
    appCategory: 'EducationalApplication',
    ymyl: false,
    subtopics: ['Stoichiometry', 'Solutions', 'Gases'],
    about: [
      'These calculators follow the methods taught in general chemistry: they name the equation, convert units and show each step so you can follow or check the working.',
      'Molar masses of common compounds are calculated from IUPAC standard atomic weights. Always check the formula on your bottle, especially for hydrates, and follow your lab’s safety rules.',
    ],
  },
  biology: {
    id: 'biology',
    name: 'Biology',
    h1: 'Biology Calculators',
    metaTitle: 'Biology Calculators: Punnett Squares, Genetics | Calcrafty',
    metaDescription:
      'Free biology calculators: build Punnett squares for one-, two- or three-gene crosses and see the genotype and phenotype ratios, with each step shown.',
    intro: 'Genetics crosses worked out step by step, with the full Punnett square drawn for you.',
    appCategory: 'EducationalApplication',
    ymyl: false,
    subtopics: ['Genetics', 'Cells and growth', 'Lab calculations'],
    about: [
      'The Punnett square calculator lists each parent’s gametes, draws the full grid and counts the genotypes and phenotypes, so you can check homework or explore a cross.',
      'It assumes simple Mendelian inheritance with complete dominance. Real traits are often more complicated, and questions about human genetic conditions are best discussed with a genetic counselor.',
    ],
  },
  ecology: {
    id: 'ecology',
    name: 'Ecology',
    h1: 'Ecology and Environment Calculators',
    metaTitle: 'Ecology Calculators: Car CO2 Emissions | Calcrafty',
    metaDescription:
      'Free ecology and environment calculators: work out your car’s yearly CO2 emissions from miles and mpg using EPA emission factors, with the math shown.',
    intro: 'Your driving footprint in CO2, using the EPA’s published emission factors.',
    appCategory: 'EducationalApplication',
    ymyl: false,
    subtopics: ['Carbon footprint', 'Energy and water', 'Populations'],
    about: [
      'These calculators estimate environmental impact from published emission factors and name the source of each one, so you can see exactly how the result was built.',
      'The car CO2 calculator uses the EPA’s figures of 8,887 grams of CO2 per gallon of gasoline and 10,180 grams per gallon of diesel, and compares your car with the EPA’s typical passenger vehicle.',
    ],
  },
  construction: {
    id: 'construction',
    name: 'Construction',
    h1: 'Construction Calculators',
    metaTitle: 'Construction Calculators: Concrete, Flooring | Calcrafty',
    metaDescription:
      'Free construction calculators for concrete, flooring, paint, roofing, gravel and square footage: quantities with waste allowances and the math shown.',
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
    metaTitle: 'Unit Converters: Length, Weight & Temperature | Calcrafty',
    metaDescription:
      'Free unit converters for length, weight and temperature: feet to meters, kg to lbs, ounces to grams and Fahrenheit to Celsius, with exact conversion factors.',
    intro: 'Exact conversions between metric and U.S. units, with every unit shown at once.',
    appCategory: 'UtilitiesApplication',
    ymyl: false,
    subtopics: ['Length and area', 'Weight and volume', 'Temperature and energy', 'Speed, data and time'],
    about: [
      'These converters use exact defined factors, such as 1 inch = 2.54 centimeters and 1 foot = 0.3048 meters, so results are as precise as your measurement.',
      'The length converter shows the result in every unit at once, including feet and inches, so you can read off whichever you need.',
      'The weight converter covers kilograms, pounds and ounces, stone and the three kinds of ton, and the temperature converter handles Fahrenheit, Celsius, kelvin and Rankine, including temperature changes, which convert differently from readings.',
    ],
  },
  food: {
    id: 'food',
    name: 'Food',
    h1: 'Food and Cooking Calculators',
    metaTitle: 'Food and Cooking Calculators: Recipe Scaler | Calcrafty',
    metaDescription:
      'Free food and cooking calculators: scale any recipe up or down to the servings you need, with every amount resized and rounded to easy kitchen fractions.',
    intro: 'Recipe scaling with amounts you can actually measure: quick answers while you cook.',
    appCategory: 'LifestyleApplication',
    ymyl: false,
    subtopics: ['Cooking', 'Recipes and portions', 'Drinks'],
    about: [
      'The recipe scaler resizes a whole ingredient list at once and rounds each amount to the nearest kitchen fraction, such as 1/3 or 3/4 cup.',
      'Pan sizes and baking times don’t scale in a straight line, so the page explains how to adjust them. For nutrition and calorie needs, see the health calculators.',
    ],
  },
  other: {
    id: 'other',
    name: 'Other',
    h1: 'Other Calculators',
    metaTitle: 'Other Calculators: Tips, Fuel Cost and More | Calcrafty',
    metaDescription:
      'Useful calculators that don’t fit a single category: a tip calculator that splits the bill, and a fuel cost calculator for any road trip or commute.',
    intro: 'Useful everyday tools that don’t fit neatly anywhere else.',
    appCategory: 'UtilitiesApplication',
    ymyl: false,
    subtopics: ['Miscellaneous', 'Driving'],
    about: [
      'Some questions don’t belong to one subject. These calculators answer them with the same care as the rest of the site: a clear method, the working shown and sources where they matter.',
      'The tip calculator works out the tip and the total, splits the bill between friends and can round each share up to the dollar. The fuel cost calculator prices a trip or a commute from distance, fuel economy and this week’s U.S. average gas price.',
    ],
  },
};

/**
 * Display order. The header shows the first six live categories and puts the rest under "More".
 * Categories with no calculators yet are hidden everywhere (see liveCategories in registry.ts).
 */
export const categoryOrder: Category[] = [
  'finance',
  'health',
  'construction',
  'math',
  'statistics',
  'everyday',
  'sports',
  'conversion',
  'food',
  'physics',
  'chemistry',
  'biology',
  'ecology',
  'other',
];
