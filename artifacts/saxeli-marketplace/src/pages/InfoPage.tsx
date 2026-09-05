import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

const content = {
  about: ['ჩვენ შესახებ', 'Saxeli არის ქართული ონლაინ ბაზარი, რომელიც ადამიანებს სანდო და მარტივი ყიდვა-გაყიდვისთვის აკავშირებს.'],
  terms: ['წესები და პირობები', 'განათავსე მხოლოდ რეალური ნივთები, აღწერე მათი მდგომარეობა ზუსტად და სხვა მომხმარებლებს პატივისცემით მოექეცი.'],
  privacy: ['კონფიდენციალურობა', 'ჩვენ მხოლოდ ანგარიშის, განცხადებებისა და მომსახურების გასაწევად საჭირო მონაცემებს ვიყენებთ. ავტორიზაცია დაცულია Clerk-ის მიერ.'],
  help: ['დახმარების ცენტრი', 'ანგარიშთან, განცხადებასთან ან უსაფრთხოებასთან დაკავშირებული კითხვებისთვის მოგვწერე support@saxeli.ge-ზე ან დაგვიკავშირდი ნომერზე +995 555 12 34 56.'],
} as const;

export default function InfoPage({ page }: { page: keyof typeof content }) {
  const [title, body] = content[page];
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14 md:px-10 md:py-24">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"><ArrowLeft size={16} /> ბაზარზე დაბრუნება</Link>
      <p className="mt-12 font-mono-ui text-[10px] uppercase tracking-[.2em] text-[hsl(var(--primary))]">Saxeli / ინფორმაცია</p>
      <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">{title}</h1>
      <p className="mt-7 text-base leading-8 text-[hsl(var(--muted-foreground))] md:text-lg">{body}</p>
    </div>
  );
}