'use client';

import { Mail, MessageCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    category: 'Food Clusters',
    questions: [
      {
        q: 'What is a Food Cluster?',
        a: 'A Food Cluster is a group order from a restaurant where multiple people combine their orders to meet the minimum basket value and split delivery costs.'
      },
      {
        q: 'How do I join a Food Cluster?',
        a: 'Browse available clusters in the Explore tab, find one from a restaurant you like, and click to view details. Add your items and join the cluster.'
      },
      {
        q: 'What happens when the minimum basket is reached?',
        a: 'Once the minimum basket value is reached, the cluster creator can place the order. All members will be notified when the food is ready for pickup.'
      },
      {
        q: 'Can I edit my order after joining?',
        a: 'Yes, you can edit your order items as long as the cluster status is still "open" and the order hasn\'t been placed yet.'
      },
      {
        q: 'How is the delivery fee split?',
        a: 'The delivery fee is split equally among all members of the cluster, making it much cheaper than ordering individually.'
      },
    ]
  },
  {
    category: 'Ride Clusters',
    questions: [
      {
        q: 'What is a Ride Cluster?',
        a: 'A Ride Cluster is a shared ride where people going in the same direction can pool together and split the fare.'
      },
      {
        q: 'How do I create a Ride Cluster?',
        a: 'Click "New Ride" on the Ride Clusters page, enter your pickup and drop-off locations, departure time, and how many seats you need.'
      },
      {
        q: 'What does "Female Only" mean?',
        a: 'Female Only rides are restricted to female members only for added safety and comfort. Only users with gender set to female can join or create these rides.'
      },
      {
        q: 'How is the fare calculated?',
        a: 'The fare per person is set by the ride creator and is typically the total estimated fare divided by the number of seats. The final fare may vary based on actual ride cost.'
      },
      {
        q: 'Can I add stops along the way?',
        a: 'Yes, the ride creator can add intermediate stops when creating the ride. Members can request to be picked up at these stops.'
      },
    ]
  },
  {
    category: 'Account & Payments',
    questions: [
      {
        q: 'How do I update my profile?',
        a: 'Go to your Profile page and click the Edit button to update your name, phone number, and college information.'
      },
      {
        q: 'Is my phone number visible to others?',
        a: 'Your phone number is only shared with cluster members once you\'ve joined the same cluster, to facilitate coordination.'
      },
      {
        q: 'How do payments work?',
        a: 'Currently, payments are handled directly between members. The cluster creator collects payments from members either in cash or via UPI.'
      },
    ]
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl w-full mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-charcoal-dark">Help & FAQ</h1>
        <p className="text-sm text-charcoal mt-1">Find answers to common questions</p>
      </div>

      {/* FAQ Sections */}
      <div className="space-y-6 w-full">
        {faqs.map((section) => (
          <div key={section.category} className="w-full">
            <h2 className="text-sm font-medium text-charcoal uppercase tracking-wide mb-3">
              {section.category}
            </h2>
            <div className="bg-white rounded-lg border border-gray-200 w-full overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                {section.questions.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`${section.category}-${index}`}
                    className="border-b last:border-b-0 w-full"
                  >
                    <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50 text-left w-full">
                      <span className="font-medium text-charcoal-dark flex-1 pr-4">{item.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 text-charcoal leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="font-medium text-charcoal-dark mb-1">Still need help?</h2>
        <p className="text-sm text-charcoal mb-4">
          Can't find what you're looking for? Reach out to us.
        </p>
        <div className="flex gap-3">
          <a
            href="mailto:support@movenmeal.com"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-charcoal-dark hover:bg-gray-50 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Email Support
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-charcoal-dark hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>

      {/* App Version */}
      <p className="text-xs text-charcoal-light text-center pb-4">
        MoveNmeal v1.0.0
      </p>
    </div>
  );
}
