import { Router, type IRouter } from "express";
import {
  GetProfileSummaryResponse,
  ListMessagesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/profile/summary", (_req, res) => {
  res.json(
    GetProfileSummaryResponse.parse({
      name: "ნინო ბერიძე",
      initials: "ნბ",
      rating: 4.9,
      activeListings: 18,
      savedItems: 6,
      unreadMessages: 3,
    }),
  );
});

router.get("/messages", (_req, res) => {
  res.json(
    ListMessagesResponse.parse([
      {
        id: "thread-1",
        name: "ლუკა გ.",
        itemTitle: "iPhone 14 Pro 256GB",
        preview: "გამარჯობა, ნივთი ისევ ხელმისაწვდომია?",
        time: "10:42",
        unread: 2,
        initials: "ლგ",
      },
      {
        id: "thread-2",
        name: "მარიამ კ.",
        itemTitle: "ტყავის ჩანთა — იტალიური",
        preview: "კურიერით გამოგზავნა შესაძლებელია?",
        time: "გუშინ",
        unread: 1,
        initials: "მკ",
      },
      {
        id: "thread-3",
        name: "გიორგი ჩ.",
        itemTitle: "მინიმალისტური მაგიდის სანათი",
        preview: "საღამოს 7 საათზე შეხვედრა შეგვიძლია.",
        time: "ორშაბათი",
        unread: 0,
        initials: "გჩ",
      },
    ]),
  );
});

export default router;