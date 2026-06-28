package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	apiKey    string
	fromEmail string
	http      *http.Client
}

func NewClient(apiKey, fromEmail string) *Client {
	return &Client{
		apiKey:    apiKey,
		fromEmail: fromEmail,
		http:      &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) Send(ctx context.Context, to, subject, htmlBody string) error {
	payload, _ := json.Marshal(map[string]interface{}{
		"from":    c.fromEmail,
		"to":      []string{to},
		"subject": subject,
		"html":    htmlBody,
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend API error: %d", resp.StatusCode)
	}
	return nil
}
