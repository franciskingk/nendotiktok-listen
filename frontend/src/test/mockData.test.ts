import { describe, it, expect } from "vitest";
import { mockVideos, formatNumber, TikTokVideo } from "@/lib/mockData";

describe("TikTokVideo interface compliance", () => {
    it("all mock videos should have the 'saves' field", () => {
        mockVideos.forEach((video) => {
            expect(video).toHaveProperty("saves");
            expect(typeof video.saves).toBe("number");
            expect(video.saves).toBeGreaterThanOrEqual(0);
        });
    });

    it("all mock videos should have required fields", () => {
        const requiredFields: (keyof TikTokVideo)[] = [
            "id", "caption", "author", "authorAvatar", "views",
            "likes", "comments", "shares", "saves", "sentiment",
            "sentimentScore", "createdAt", "hashtags", "thumbnailUrl",
        ];

        mockVideos.forEach((video) => {
            requiredFields.forEach((field) => {
                expect(video).toHaveProperty(field);
            });
        });
    });

    it("sentiment should be one of positive, neutral, negative", () => {
        const validSentiments = ["positive", "neutral", "negative"];
        mockVideos.forEach((video) => {
            expect(validSentiments).toContain(video.sentiment);
        });
    });

    it("hashtags should be an array of strings", () => {
        mockVideos.forEach((video) => {
            expect(Array.isArray(video.hashtags)).toBe(true);
            video.hashtags.forEach((tag) => {
                expect(typeof tag).toBe("string");
            });
        });
    });
});

describe("formatNumber utility", () => {
    it("should format millions correctly", () => {
        expect(formatNumber(1000000)).toBe("1.0M");
        expect(formatNumber(2500000)).toBe("2.5M");
        expect(formatNumber(10500000)).toBe("10.5M");
    });

    it("should format thousands correctly", () => {
        expect(formatNumber(1000)).toBe("1.0K");
        expect(formatNumber(25000)).toBe("25.0K");
        expect(formatNumber(999999)).toBe("1000.0K");
    });

    it("should format small numbers as-is", () => {
        expect(formatNumber(0)).toBe("0");
        expect(formatNumber(1)).toBe("1");
        expect(formatNumber(999)).toBe("999");
    });
});

describe("dashboard data calculations", () => {
    it("should correctly sum total views from videos", () => {
        const totalViews = mockVideos.reduce((acc, v) => acc + (v.views || 0), 0);
        expect(totalViews).toBeGreaterThan(0);
        expect(typeof totalViews).toBe("number");
    });

    it("should correctly sum total saves from videos", () => {
        const totalSaves = mockVideos.reduce((acc, v) => acc + (v.saves || 0), 0);
        expect(totalSaves).toBeGreaterThan(0);
        expect(typeof totalSaves).toBe("number");
    });

    it("should calculate average engagement correctly", () => {
        const avgEngagement = mockVideos.length > 0
            ? (mockVideos.reduce((acc, v) => acc + (v.sentimentScore || 0), 0) / mockVideos.length) * 100
            : 0;
        expect(avgEngagement).toBeGreaterThan(0);
        expect(avgEngagement).toBeLessThanOrEqual(100);
    });
});
