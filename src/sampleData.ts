import { VoCRecord } from './types';
import { parseActionDetails, inferStatus, getNPSCategory, classifyTopic, analyzeSentiment } from './utils/parser';

const sampleRecordsRaw = [
  {
    id: '263437429',
    likelihood: 1,
    interaction: 'PNHGTW',
    comment: `To be honest it was my worst experience with DHL in my life promises was made and not kept i was driving up and down on my cost after i pay foe emergency express i am not happy i almost missed my flight regards.`,
    actionDetailsRaw: `[2026-04-10 09:00:00] Received and arranged remote booking on the same day.; [2026-04-11 10:00:00] Pickup unavailable due to weekend.; [2026-04-13 09:00:00] Pickup unavailable due to public holidays in Thailand.; [2026-04-14 09:00:00] Public holidays in Cambodia.; [2026-04-18 14:00:00] No inbound flights available to Cambodia.; [2026-04-20 08:30:00] Shipment arrived in Cambodia. Arranged urgent self-collection as requested by the customer. Shipment successfully self-collected.; [2026-04-21 16:30:00] Apologized for the inconvenience and thanked the customer for their feedback and understanding.;`,
    owner: 'Rothana Art',
    followUpComments: `Yes, DHL can contact me if clarification is needed *

- Customer was extremely frustrated because of the weekend and holiday delays across Thailand and Cambodia during their urgent travel timeline. 
- Highly recommended to set up automatic pro-active notifications when shipments intersect public holidays.`
  },
  {
    id: '246896936',
    likelihood: 3,
    interaction: 'PNHGTW',
    comment: `There are many wrong spelling in the address destination and the university name after I check it 2time with the staff. and now my document almost arrived in South Korea with the wrong spelling address.`,
    actionDetailsRaw: `[2026-03-10 10:00:00] 1. I have apologized to the customer for any inconvenience caused.; [2026-03-12 14:30:00] 2. I will share this feedback with the Retail Team Manager so they can investigate the case further and help improve our service quality and prevent this from happening again.;`,
    owner: 'Rothana Art',
    followUpComments: `Yes, DHL can contact me if clarification is needed *

- Addressed address validation gaps. 
- Forwarded details to the retail counter to implement spelling verification workflows, especially for overseas university destination documents.`
  },
  {
    id: '28168109',
    likelihood: 4,
    interaction: 'PNHGTW',
    comment: `DHL customs clearance is a bit complicated. I have used DHL many times before without any clearance issues, but this problem only happened this year. When my shipment went through formal clearance, the first DHL staff (Sreynich) told me they could not process the clearance for the customer but did not give a reason. They advised me to do the clearance myself or use my own broker. The next day, another person contacted me and said the same thing, this time through Telegram (0975800200).

When my team went to collect the ppwk from DHL, the front desk staff (Chanmorokot) also said the same but did not explain why DHL could not handle the clearance, even though I asked for a reason for many times. This shipment is difficult to process as I need to apply for a health permit and also spend a lot on storage bond fees.

Therefore, I understand that DHL is a standard company, which is why they mainly use email to keep information confidential. However, not all customers check their email regularly. If DHL could use other communication platforms as well, it would be helpful, especially for urgent shipments.`,
    actionDetailsRaw: `[2026-06-02 16:58:34] Alert Created: First Call: First Call; [2026-06-02 17:01:17] Alert status set to New; [2026-06-02 17:01:17] Alert Assigned: Automatically assigned to rathana.hout@dhl.com; [2026-06-02 18:15:29] Alert Assigned: Assigned to Thida Sovann (DHL KH) by sreynich Kong (DHL KH) (sreynich.kong@dhl.com); [2026-06-02 20:56:55] Case Edited: First Call Outcome · Invitation survey comment · Should we make a second call? · Likelihood to recommend · Ease of Use (thida.sovann@dhl.com); [2026-06-02 20:56:56] Alert Closed (thida.sovann@dhl.com); [2026-06-02 20:57:40] Alert Created: Detractor: Requested follow-up: Detractor: Requested follow-up; [2026-06-02 20:58:56] Alert status set to New; [2026-06-03 00:25:13] Alert Assigned: Assigned to Panha Chhun (DHL KH) by Panha Chhun (DHL KH) (panha.chhun@dhl.com); [2026-06-03 21:41:34] Case Edited: Type of Contact · Contact Outcome · Any actions you can take on the case? · Follow-up: Customer Comments · Follow-up Updated Customer Name · Follow-up Updated Phone Number · Do you need someone else to look at the case? · Should we flag this case for the Regional ICCC Team's attention? (panha.chhun@dhl.com); [2026-06-03 21:41:57] Case Edited: Action Details (panha.chhun@dhl.com); [2026-06-05 01:06:21] Case Edited: Any actions you can take on the case? · Action Details (panha.chhun@dhl.com); [2026-06-05 01:06:27] Alert Closed: - Per checked the voice recording, Sreynich already provided clear explanation to Ms. Sereyroth (NCI 855977770602) regarding a reason that we are unable to process clearance on their behalf. The customer advised that they import more than 3 kg, and they don't have any import license due to shipment is sample and shipment value is lower than 50 USD, so we recommend them for self-clearance.

- Upon checking, the shipment's declared value in Sherloc is USD 11. The customer has requested an amendment through our agent, Sreynich Kong, to increase the value and revise the description.

- During the customer's visit to the CCO counter, no amendment fee was charged, as the amendment request was only submitted on 4 June and PPWK has been withdrawn since 19 May. As per the email, Customs has requested to meet the consignee. Additionally, Morokoth explained why DHL could not process the clearance on behalf of the consignee. Unfortunately, as the communication was conducted offline, we do not have any reference records.

- After receiving the feedback from relevant team, I make call to customer, and she admitted that she mistakenly told me that she has paid amendment fee once she came to collect PPWK.

- I have explained the requirement to clear commodity such as medicine, why her shipment goes to formal clearance, and clearance service fee from DHL.`,
    owner: 'Panha Chhun (DHL KH)',
    followUpComments: `- Customer concern on why her shipment need to process formal clearance.
- What is the charge of 383,350 KHR (She mentioned it is expensive)`
  },
  {
    id: '28172901',
    likelihood: 10,
    interaction: 'PNHGTW',
    comment: `Excellent service! The express delivery arrived ahead of schedule, and the clearance was handled entirely by DHL with zero hassle. Sophy in customer service kept me updated every step of the way. Truly professional courier service!`,
    actionDetailsRaw: `[2026-06-05 09:12:00] Alert Created: Promoter feedback received; [2026-06-05 10:00:15] Thank-you email automatically sent to customer; [2026-06-05 11:30:00] Feedback shared with Sophy's supervisor for recognition; [2026-06-05 11:35:00] Alert Closed (system.auto);`,
    owner: 'Sophy Long (DHL KH)',
    followUpComments: `No follow-up required as customer is extremely satisfied with express clearance.`
  },
  {
    id: '28169450',
    likelihood: 8,
    interaction: 'SGNEXP',
    comment: `Delivery was quick, but the billing statement was confusing. I was charged a remote area surcharge without being notified beforehand. The delivery rider was extremely polite though.`,
    actionDetailsRaw: `[2026-06-03 14:10:22] Alert Created: Passive follow-up required; [2026-06-03 15:30:45] Assigned to Rathana Hout; [2026-06-04 10:15:00] Case Edited: Reached out to customer via phone to explain the remote area zip code policy; [2026-06-04 10:18:12] Case status set to Pending - customer checking their billing records;`,
    owner: 'Rathana Hout',
    followUpComments: `- Clarified Remote Area Surcharge policy.
- Customer is reviewing invoice details and postcode coordinates.`
  },
  {
    id: '28167332',
    likelihood: 5,
    interaction: 'PNHGTW',
    comment: `I had to pay double duties at the customs counter because the invoice description wasn't declared correctly by the shipper. I tried calling the helpline multiple times but got stuck in the interactive voice response menu. This caused a 3-day delay.`,
    actionDetailsRaw: `[2026-06-01 08:30:00] Alert Created: Detractor alert; [2026-06-01 09:15:00] Assigned to Sreynich Kong; [2026-06-01 11:20:00] Alert status set to In Progress; [2026-06-02 10:14:00] Case Edited: Contacted client and apologized for the hotline delay. Explained that shipper declaration determines customs duty calculation, but offered to assist in future cargo description pre-checks;`,
    owner: 'Sreynich Kong',
    followUpComments: `- Apologized for hotline hold times.
- Advised on correct declaration formats for future shipments.`
  },
  {
    id: '28174411',
    likelihood: 2,
    interaction: 'PNHGTW',
    comment: `Extremely frustrated. My package containing temperature-sensitive medical supplies has been stuck in the warehouse for 5 days. Nobody has reached out to explain what documents are missing!`,
    actionDetailsRaw: `[2026-06-09 16:45:00] Alert Created: Critical detractor alert; [2026-06-09 17:00:00] Assigned to Thida Sovann; [2026-06-09 17:05:00] High-priority escalation triggered;`,
    owner: 'Thida Sovann',
    followUpComments: `Urgent - shipment contains temperature-sensitive goods. Needs immediate document clearance verification.`
  }
];

export const sampleRecords: VoCRecord[] = sampleRecordsRaw.map(r => {
  const timeline = parseActionDetails(r.actionDetailsRaw);
  
  // High fidelity mapped defaults based on records
  let transactionName = 'Delivery by Courier';
  let easeOfUse = 9;
  let customerName = 'Unknown Customer';
  let awbNumber = '7754719313';
  let customSummary = '';
  let responseFeedbackChannel = 'Email';
  
  if (r.id === '263437429') {
    transactionName = 'Emergency Express Delivery';
    easeOfUse = 1;
    customerName = 'QUINTIN ANTON KRUGER';
    awbNumber = '9625582050';
    customSummary = 'Customer had their worst experience due to pickup delays from public holidays/weekends in Thailand & Cambodia, costing extra and nearly missing their flight.';
    responseFeedbackChannel = 'Email';
  } else if (r.id === '246896936') {
    transactionName = 'Document Shipment';
    easeOfUse = 3;
    customerName = 'CHHIM SIVPINK';
    awbNumber = '1381772966';
    customSummary = 'Consignee details & university name misspelled twice by staff, causing document shipment to arrive in South Korea with critical address errors.';
    responseFeedbackChannel = 'Retail';
  } else if (r.id === '28168109') {
    transactionName = 'Duties and Taxes Payment to Employee';
    easeOfUse = 4;
    customerName = 'RETH SEREYROTH';
    awbNumber = '1126612675';
    customSummary = 'Complicated customs clearance and lack of communication beyond email; customer advises high storage fees and unclear formal procedures.';
    responseFeedbackChannel = 'Telegram';
  } else if (r.id === '28172901') {
    transactionName = 'Delivery by Courier';
    easeOfUse = 10;
    customerName = 'SAR SARIN';
    awbNumber = '9714481980';
    customSummary = 'Outstanding service: express delivery arrived early and customs clearance was fully managed by staff with no friction.';
    responseFeedbackChannel = 'SMS';
  } else if (r.id === '28169450') {
    transactionName = 'Delivery Notification';
    easeOfUse = 8;
    customerName = 'MR. SAI SOPHORN';
    awbNumber = '6861773026';
    customSummary = 'Quick delivery but billing statement was confusing due to a remote area surcharge applied without prior notice.';
    responseFeedbackChannel = 'Phone';
  } else if (r.id === '28167332') {
    transactionName = 'Duties and Taxes Payment';
    easeOfUse = 5;
    customerName = 'SOKLENG SUN';
    awbNumber = '4519764675';
    customSummary = 'Shipper invoice declared incorrectly, causing double duties. Client experienced a 3-day delay and got stuck in the interactive hotline IVR.';
    responseFeedbackChannel = 'Phone';
  } else if (r.id === '28174411') {
    transactionName = 'Delivery Exception';
    easeOfUse = 2;
    customerName = 'MEAS CHANMONORITH';
    awbNumber = '4179434965';
    customSummary = 'Medical supplies warehouse delay: temperature-sensitive package stuck for 5 days with zero proactive communication regarding missing files.';
    responseFeedbackChannel = 'Email';
  }

  // Set deadlines and PICs for timeline if they match our specific cases
  if (r.id === '263437429') {
    timeline.forEach(ev => {
      ev.pic = 'Rothana Art';
      ev.deadline = '30 Apr';
      ev.status = 'Completed';
    });
  } else if (r.id === '246896936') {
    timeline.forEach(ev => {
      ev.pic = 'Rothana Art';
      ev.deadline = '15 Mar';
      ev.status = 'Completed';
    });
  }

  const topic = classifyTopic(r.comment, transactionName);
  const sentiment = analyzeSentiment(r.comment, r.likelihood);

  return {
    id: r.id,
    likelihood: r.likelihood,
    category: getNPSCategory(r.likelihood),
    comment: r.comment,
    customSummary: customSummary || undefined,
    actionDetailsRaw: r.actionDetailsRaw,
    timeline,
    owner: r.owner || '(blank)',
    status: r.id === '263437429' || r.id === '246896936' ? 'Completed' : inferStatus(timeline, r.actionDetailsRaw),
    interaction: r.interaction,
    followUpComments: r.followUpComments,
    journeyName: 'I get the shipment delivered/self collect',
    momentOfTruthName: transactionName.includes('Duties') ? 'Duties and Taxes Payment' : 'Delivery by Courier',
    transactionName,
    easeOfUse,
    responseDate: r.id === '263437429' ? '2026-04-21 16:30' : r.id === '246896936' ? '2026-03-12 14:30' : '2026-06-30 14:12',
    creationDate: r.id === '263437429' ? '2026-04-10 09:00' : r.id === '246896936' ? '2026-03-10 10:00' : '2026-06-29 16:09',
    customerName,
    countryName: 'Cambodia',
    region: 'ASIA PACIFIC (EXCL. CHINA)',
    industry: r.id === '263437429' ? 'Retail & Consumer' : r.id === '246896936' ? 'Education' : 'Fashion & Apparel',
    awbNumber,
    topic,
    sentiment,
    responseFeedbackChannel
  };
});
