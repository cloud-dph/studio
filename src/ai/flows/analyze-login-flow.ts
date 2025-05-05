'use server';
/**
 * @fileOverview Analyzes login attempts for suspicious patterns using AI.
 *
 * - analyzeLoginAttempt - A function that assesses the risk of a login attempt.
 * - AnalyzeLoginInput - The input type for the analyzeLoginAttempt function.
 * - AnalyzeLoginOutput - The return type for the analyzeLoginAttempt function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnalyzeLoginInputSchema = z.object({
  mobile: z.string().describe('The mobile number attempting to log in.'),
  timestamp: z.string().datetime().describe('The ISO 8601 timestamp of the login attempt.'),
  // In a real scenario, include IP Address, User Agent, etc.
  // ipAddress: z.string().optional().describe('The IP address of the login attempt.'),
  // userAgent: z.string().optional().describe('The User Agent string of the client.'),
});
export type AnalyzeLoginInput = z.infer<typeof AnalyzeLoginInputSchema>;

const AnalyzeLoginOutputSchema = z.object({
  isSuspicious: z.boolean().describe('Whether the login attempt is deemed suspicious.'),
  reason: z.string().describe('The reason for the suspicion, or "Login appears normal" if not suspicious.'),
  riskScore: z.number().min(0).max(1).describe('A score between 0 (low risk) and 1 (high risk) indicating the level of suspicion.'),
});
export type AnalyzeLoginOutput = z.infer<typeof AnalyzeLoginOutputSchema>;


export async function analyzeLoginAttempt(input: AnalyzeLoginInput): Promise<AnalyzeLoginOutput> {
  return analyzeLoginFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeLoginPrompt',
  input: {
    schema: AnalyzeLoginInputSchema,
  },
  output: {
    schema: AnalyzeLoginOutputSchema,
  },
  prompt: `Analyze the following login attempt details for potential security risks or suspicious behavior. Consider factors like the time of the attempt. Although IP address and user agent are not provided, assess based on the available information if the attempt seems unusual or potentially automated.

Login Details:
Mobile Number (Identifier): {{{mobile}}}
Timestamp: {{{timestamp}}}

Is this login attempt suspicious? Provide a boolean flag, a brief reason, and a risk score between 0 (low) and 1 (high). Focus on identifying patterns that might suggest non-human or fraudulent activity, even with limited data. If nothing seems suspicious, indicate that clearly.`,
});

const analyzeLoginFlow = ai.defineFlow<
  typeof AnalyzeLoginInputSchema,
  typeof AnalyzeLoginOutputSchema
>(
  {
    name: 'analyzeLoginFlow',
    inputSchema: AnalyzeLoginInputSchema,
    outputSchema: AnalyzeLoginOutputSchema,
  },
  async (input) => {
    // In a real application, you might fetch user login history here
    // or use Genkit tools to check IP reputation, etc.

    const {output} = await prompt(input);

    // Add basic rule: Logins between 1 AM and 5 AM are slightly more suspicious
    const loginHour = new Date(input.timestamp).getHours();
    let baseScore = output!.riskScore;
    let reason = output!.reason;
    let isSuspicious = output!.isSuspicious;

    if (loginHour >= 1 && loginHour < 5) {
      if (baseScore < 0.7) { // Increase score if not already high
          baseScore = Math.min(1, baseScore + 0.2);
          isSuspicious = baseScore > 0.5; // Update suspicious flag based on new score
          if (reason === 'Login appears normal' || !reason.includes('unusual hour')) {
             reason = isSuspicious ? `Login at unusual hour (${loginHour}:00). ${reason}`.replace('. Login appears normal', '') : reason;
          }
      }
    }


    return {
        isSuspicious: isSuspicious,
        reason: reason.trim(),
        riskScore: baseScore,
    };
  }
);
