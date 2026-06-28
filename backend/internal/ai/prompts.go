package ai

import "fmt"

func CoverLetterSystem(tone string) string {
	toneDesc := map[string]string{
		"professional": "professional and formal",
		"warm":         "warm, personal, and emotionally compelling",
		"competitive":  "assertive, direct, and highly competitive — emphasizing the buyer's strength",
	}
	t, ok := toneDesc[tone]
	if !ok {
		t = "professional and formal"
	}
	return fmt.Sprintf(
		"You are a real estate agent writing a buyer cover letter to accompany an offer. "+
			"Tone: %s. Write in first person as the agent. Under 300 words. "+
			"Output only the letter text — no subject line, no preamble, no sign-off placeholder, no markdown.",
		t,
	)
}

func CoverLetterPrompt(address, listingPrice, offerAmount, loanType, closingDate, buyerName, buyerStory, features string) string {
	return fmt.Sprintf(
		"Property: %s. Listing price: %s. Our offer: %s. Loan type: %s. "+
			"Desired closing: %s. Buyers: %s. About the buyers: %s. Notable features: %s.",
		address, listingPrice, offerAmount, loanType, closingDate, buyerName, buyerStory, features,
	)
}

func OfferSummarySystem() string {
	return "You are a real estate transaction coordinator. Write a concise 2-3 sentence executive summary " +
		"of the offer terms below. Plain text only, no markdown, no bullet points."
}

func OfferSummaryPrompt(address, offerAmount, loanType, closingDate string, contingencies []string) string {
	return fmt.Sprintf(
		"Property: %s. Offer: %s. Loan: %s. Closing: %s. Contingencies: %v.",
		address, offerAmount, loanType, closingDate, contingencies,
	)
}
