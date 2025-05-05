
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

// Simplified input schema (for demonstration)
const AnalyzeLoginInputSchema = z.object({
    mobile: z.string().describe('The mobile number attempting to log in.'),
    timestamp: z.string().datetime().describe('The ISO 8601 timestamp of the login attempt.'),
    // In a real scenario, include IP Address, User Agent, Location Data etc.
    // ipAddress: z.string().optional().describe('The IP address of the login attempt.'),
    // userAgent: z.string().optional().describe('The User Agent string of the client.'),
});
export type AnalyzeLoginInput = z.infer<typeof AnalyzeLoginInputSchema>;

const AnalyzeLoginOutputSchema = z.object({
    isSuspicious: z.boolean().describe('Whether the login attempt is deemed suspicious by the AI.'),
    reason: z.string().describe('The AI\'s reason for the suspicion, or "Login appears normal" if not suspicious.'),
    riskScore: z.number().min(0).max(1).describe('A score between 0 (low risk) and 1 (high risk) indicating the level of suspicion, as determined by the AI.'),
});
export type AnalyzeLoginOutput = z.infer<typeof AnalyzeLoginOutputSchema>;


export async function analyzeLoginAttempt(input: AnalyzeLoginInput): Promise<AnalyzeLoginOutput> {
    // This function now directly calls the flow without additional logic.
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
    prompt: `Analyze the following login attempt details for potential security risks or suspicious behavior. Consider factors like the time of the attempt. Although IP address and user agent are not provided, assess based on the available information if the attempt seems unusual or potentially automated (e.g., bot activity, credential stuffing patterns if applicable).

Login Details:
Mobile Number (Identifier): {{{mobile}}}
Timestamp: {{{timestamp}}}

Is this login attempt suspicious? Provide a boolean flag, a brief reason, and a risk score between 0 (low) and 1 (high). Focus on identifying patterns that might suggest non-human or fraudulent activity based solely on the provided mobile number and timestamp context. If nothing seems inherently suspicious from this limited data, indicate that clearly.`,
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
        // Removed the additional time-based rule.
        // The flow now relies solely on the AI model's analysis.
        // In a real-world scenario, you might add calls to external services here
        // (e.g., IP reputation checks, device fingerprinting analysis) before or after the prompt.

        const {output} = await prompt(input);

        // Return the AI's assessment directly.
        return output!; // Assuming the prompt always returns a valid output based on the schema.
    }
);
