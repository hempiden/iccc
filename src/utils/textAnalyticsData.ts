import { TopicSentimentRecord, TopicAnalyticsItem, SentimentType, TopicHighlightSummary } from '../types';

export const RAW_SAMPLE_CSV = `Survey ID,Comment Field,Comment,Phrase,Topic/Theme,Sentiment,Main Score incl. Social,Complete Country Unit
307934232,Invitation survey comment,"I am very happy to give rate number 9/10 for service Pu/Del of DHL Express. because courier has provided a good service for customer: - Courier is friendly and Polite - Courier is flexible for professional skill in the providing delivery service.","because courier has provided a good service for customer: - Courier is friendly and Polite - Courier is flexible for professional skill in the providing delivery service.",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
307934232,Invitation survey comment,"I am very happy to give rate number 9/10 for service Pu/Del of DHL Express. because courier has provided a good service for customer: - Courier is friendly and Polite - Courier is flexible for professional skill in the providing delivery service.","because courier has provided a good service for customer: - Courier is friendly and Polite - Courier is flexible for professional skill in the providing delivery service.",Courier - Knowledge and Competence,POSITIVE,9,Cambodia
307934232,Invitation survey comment,"I am very happy to give rate number 9/10 for service Pu/Del of DHL Express. because courier has provided a good service for customer: - Courier is friendly and Polite - Courier is flexible for professional skill in the providing delivery service.","because courier has provided a good service for customer: - Courier is friendly and Polite - Courier is flexible for professional skill in the providing delivery service.",Courier - Overall satisfaction,POSITIVE,9,Cambodia
307934232,Invitation survey comment,"I am very happy to give rate number 9/10 for service Pu/Del of DHL Express. because courier has provided a good service for customer: - Courier is friendly and Polite - Courier is flexible for professional skill in the providing delivery service.","because courier has provided a good service for customer: - Courier is friendly and Polite - Courier is flexible for professional skill in the providing delivery service.",Courier - Politeness,POSITIVE,9,Cambodia
307934232,Invitation survey comment,"I am very happy to give rate number 9/10 for service Pu/Del of DHL Express. because courier has provided a good service for customer: - Courier is friendly and Polite - Courier is flexible for professional skill in the providing delivery service.","because courier has provided a good service for customer: - Courier is friendly and Polite - Courier is flexible for professional skill in the providing delivery service.",Delivery - Overall Satisfaction,POSITIVE,9,Cambodia
307930068,Invitation survey comment,I like to use service DHL Express and give rate number 9/10 for service Pu/Del. Good Service and fast .,I like to use service DHL Express and give rate number 9/10 for service Pu/Del. Good Service and fast .,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
307930068,Invitation survey comment,I like to use service DHL Express and give rate number 9/10 for service Pu/Del. Good Service and fast .,I like to use service DHL Express and give rate number 9/10 for service Pu/Del. Good Service and fast .,Pickup - Overall Satisfaction,POSITIVE,9,Cambodia
307930068,Invitation survey comment,I like to use service DHL Express and give rate number 9/10 for service Pu/Del. Good Service and fast .,I like to use service DHL Express and give rate number 9/10 for service Pu/Del. Good Service and fast .,Pickup - Reliability,POSITIVE,9,Cambodia
307928582,Invitation survey comment,I think that service DHL Express is GOOD .,I think that service DHL Express is GOOD .,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
307945679,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.",Customs Clearance - Process,POSITIVE,9,Cambodia
307945679,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.",Support - Resolution Efficiency,POSITIVE,9,Cambodia
307946057,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
307480223,Invitation survey comment,I like to use service DHL Express and comment service 9/10 for service Pu/Del. Good Service,I like to use service DHL Express and comment service 9/10 for service Pu/Del. Good Service,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
307480223,Invitation survey comment,I like to use service DHL Express and comment service 9/10 for service Pu/Del. Good Service,I like to use service DHL Express and comment service 9/10 for service Pu/Del. Good Service,Pickup - Overall Satisfaction,POSITIVE,9,Cambodia
307480223,Invitation survey comment,I like to use service DHL Express and comment service 9/10 for service Pu/Del. Good Service,I like to use service DHL Express and comment service 9/10 for service Pu/Del. Good Service,Pickup - Reliability,POSITIVE,9,Cambodia
307480080,Invitation survey comment,"I am very satisfying with service Pu/Del of DHL Express. Courier is easy connecting people and delivered is very fast, exceed expectation.",I am very satisfying with service Pu/Del of DHL Express.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
307480080,Invitation survey comment,"I am very satisfying with service Pu/Del of DHL Express. Courier is easy connecting people and delivered is very fast, exceed expectation.",I am very satisfying with service Pu/Del of DHL Express.,Pickup - Overall Satisfaction,POSITIVE,9,Cambodia
307480080,Invitation survey comment,"I am very satisfying with service Pu/Del of DHL Express. Courier is easy connecting people and delivered is very fast, exceed expectation.","Courier is easy connecting people and delivered is very fast, exceed expectation.",Delivery - Ease of Process,POSITIVE,9,Cambodia
307480080,Invitation survey comment,"I am very satisfying with service Pu/Del of DHL Express. Courier is easy connecting people and delivered is very fast, exceed expectation.","Courier is easy connecting people and delivered is very fast, exceed expectation.",Delivery - Timeliness,POSITIVE,9,Cambodia
307500897,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.",Customs Clearance - Process,POSITIVE,9,Cambodia
307500897,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.",Support - Resolution Efficiency,POSITIVE,9,Cambodia
307501888,Invitation survey comment,"Customs clearance by DHL is efficient. However, it would be much better if DHL could provide an estimated duty and tax amount upfront. For my previous shipments, I had to request an estimated quote multiple times, which was time-consuming and caused unnecessary delays.",Customs clearance by DHL is efficient.,Brand - Overall Satisfaction,POSITIVE,5,Cambodia
307501888,Invitation survey comment,"Customs clearance by DHL is efficient. However, it would be much better if DHL could provide an estimated duty and tax amount upfront. For my previous shipments, I had to request an estimated quote multiple times, which was time-consuming and caused unnecessary delays.","However, it would be much better if DHL could provide an estimated duty and tax amount upfront.",Brand - Overall Satisfaction,NEGATIVE,5,Cambodia
307501888,Invitation survey comment,"Customs clearance by DHL is efficient. However, it would be much better if DHL could provide an estimated duty and tax amount upfront. For my previous shipments, I had to request an estimated quote multiple times, which was time-consuming and caused unnecessary delays.","However, it would be much better if DHL could provide an estimated duty and tax amount upfront.",Customs Clearance - Duties/Taxes/Fees,NEGATIVE,5,Cambodia
307501888,Invitation survey comment,"Customs clearance by DHL is efficient. However, it would be much better if DHL could provide an estimated duty and tax amount upfront. For my previous shipments, I had to request an estimated quote multiple times, which was time-consuming and caused unnecessary delays.","For my previous shipments, I had to request an estimated quote multiple times, which was time-consuming and caused unnecessary delays.",Delivery - Delivery Instructions/Modifications,NEGATIVE,5,Cambodia
307501888,Invitation survey comment,"Customs clearance by DHL is efficient. However, it would be much better if DHL could provide an estimated duty and tax amount upfront. For my previous shipments, I had to request an estimated quote multiple times, which was time-consuming and caused unnecessary delays.","For my previous shipments, I had to request an estimated quote multiple times, which was time-consuming and caused unnecessary delays.",Delivery - Time windows,NEGATIVE,5,Cambodia
307501949,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
306930799,Invitation survey comment,"Communication between staff should be better. I went to a service point around my area and the staff told me that the item was at the head office...",Communication between staff should be better.,People - Overall Satisfaction,NEGATIVE,8,Cambodia
306930799,Invitation survey comment,"Communication between staff should be better...","When I arrived at the Head Office, staff there told me that the item is already on the way to my service point.",Service Point - Self Service - Overall Satisfaction,NO_OPINION,8,Cambodia
306930799,Invitation survey comment,"Communication between staff should be better...","I went to a service point around my area and the staff told me that the item was at the head office and if I want to pick up now,",Service Point - Self Service - Overall Satisfaction,NO_OPINION,8,Cambodia
306941563,Invitation survey comment,Fast and smooth services.,Fast and smooth services.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
305711515,Invitation survey comment,Nice. the speed of arrival is satisfied. the communication of delivery person always friendly.,the communication of delivery person always friendly.,Courier - Politeness,POSITIVE,9,Cambodia
306337628,Invitation survey comment,DHL courier has done great job,DHL courier has done great job,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
306337628,Invitation survey comment,DHL courier has done great job,DHL courier has done great job,Courier - Overall satisfaction,POSITIVE,9,Cambodia
306366748,Invitation survey comment,DHL courier has done great job,DHL courier has done great job,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
306366748,Invitation survey comment,DHL courier has done great job,DHL courier has done great job,Courier - Overall satisfaction,POSITIVE,9,Cambodia
306347572,Invitation survey comment,DHL courier has done great job,DHL courier has done great job,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
306347572,Invitation survey comment,DHL courier has done great job,DHL courier has done great job,Courier - Overall satisfaction,POSITIVE,9,Cambodia
306374466,Invitation survey comment,DHL courier has done great job,DHL courier has done great job,Brand - Overall Satisfaction,POSITIVE,8,Cambodia
306374466,Invitation survey comment,DHL courier has done great job,DHL courier has done great job,Courier - Overall satisfaction,POSITIVE,8,Cambodia
306516310,Invitation survey comment,DHL courier and service is the best,DHL courier and service is the best,Brand - Overall Satisfaction,POSITIVE,10,Cambodia
306371253,Invitation survey comment,"DHL service is great, no issue so far","DHL service is great, no issue so far",Brand - Overall Satisfaction,POSITIVE,8,Cambodia
306357075,Invitation survey comment,"DHL service is great, no issue so far","DHL service is great, no issue so far",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
305561088,Invitation survey comment,A fast and reliable service!,A fast and reliable service!,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
305561088,Invitation survey comment,A fast and reliable service!,A fast and reliable service!,Brand - Reliability,POSITIVE,9,Cambodia
305554636,Invitation survey comment,DHL provide great service so far,DHL provide great service so far,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
305560967,Invitation survey comment,DHL provide great service,DHL provide great service,Brand - Overall Satisfaction,POSITIVE,8,Cambodia
305547230,Invitation survey comment,DHL couriers provide great service for us so far.,DHL couriers provide great service for us so far.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
305547230,Invitation survey comment,DHL couriers provide great service for us so far.,DHL couriers provide great service for us so far.,Courier - Overall satisfaction,POSITIVE,9,Cambodia
305578240,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
305553638,Invitation survey comment,"Timely No fuss Friendly","No fuss Friendly",People - Politeness,POSITIVE,10,Cambodia
305711500,Invitation survey comment,It's easy for tracking and on time,It's easy for tracking and on time,Digital User Experience - Tracking,POSITIVE,9,Cambodia
305043960,Invitation survey comment,I am very satisfying with service DHL Express and give rate number 9/10 for service PU/DEL.,I am very satisfying with service DHL Express and give rate number 9/10 for service PU/DEL.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
305046279,Invitation survey comment,"I am very satisfying with service DHL Express and give rate number 10/10 on the Pu /Del, - Good Service (communication Convenience)",- Good Service (communication Convenience),Brand - Overall Satisfaction,POSITIVE,10,Cambodia
305046279,Invitation survey comment,"I am very satisfying with service DHL Express and give rate number 10/10 on the Pu /Del, - Good Service (communication Convenience)","I am very satisfying with service DHL Express and give rate number 10/10 on the Pu /Del,",Brand - Overall Satisfaction,POSITIVE,10,Cambodia
305042507,Problem experience comment,"It still more expensive for service , if we compare with other company","It still more expensive for service , if we compare with other company",Brand - Competitor Mentions,NEGATIVE,7,Cambodia
305042507,Problem experience comment,"It still more expensive for service , if we compare with other company","It still more expensive for service , if we compare with other company",Price - Competitiveness,NEGATIVE,7,Cambodia
304493710,Invitation survey comment,I think that service DHL Express is good.,I think that service DHL Express is good.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
304494240,Invitation survey comment,"I am very satisfying to use service Pu /Del of DHL Express, and happy to give score number 10/10. I have shared about the best service DHL Express to my friend. - The best Service (No Damage No Broken No lost) - Courier has been delivered shipments so fast.","I am very satisfying to use service Pu /Del of DHL Express, and happy to give score number 10/10.",Brand - Overall Satisfaction,POSITIVE,10,Cambodia
304494240,Invitation survey comment,"I am very satisfying to use service Pu /Del of DHL Express, and happy to give score number 10/10...","I am very satisfying to use service Pu /Del of DHL Express, and happy to give score number 10/10.",Pickup - Overall Satisfaction,POSITIVE,10,Cambodia
304494240,Invitation survey comment,"I am very satisfying to use service Pu /Del of DHL Express...",I have shared about the best service DHL Express to my friend.,Brand - Overall Satisfaction,POSITIVE,10,Cambodia
304494240,Invitation survey comment,"I am very satisfying to use service Pu /Del of DHL Express...","- The best Service (No Damage No Broken No lost) - Courier has been delivered shipments so fast.",Brand - Overall Satisfaction,POSITIVE,10,Cambodia
304494240,Invitation survey comment,"I am very satisfying to use service Pu /Del of DHL Express...","- The best Service (No Damage No Broken No lost) - Courier has been delivered shipments so fast.",Delivery - Lost/Incomplete,POSITIVE,10,Cambodia
304494240,Invitation survey comment,"I am very satisfying to use service Pu /Del of DHL Express...","- The best Service (No Damage No Broken No lost) - Courier has been delivered shipments so fast.",Delivery - Timeliness,POSITIVE,10,Cambodia
304508032,Invitation survey comment,"I am very satisfying about the service Pu/ Del of DHL Express, and happy to give rate number 9/10 for courier SV02. - Delivered the shipment on timed - Courier DHL Express is always call when late.","I am very satisfying about the service Pu/ Del of DHL Express, and happy to give rate number 9/10 for courier SV02.",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
304508032,Invitation survey comment,"I am very satisfying about the service Pu/ Del of DHL Express...","I am very satisfying about the service Pu/ Del of DHL Express, and happy to give rate number 9/10 for courier SV02.",Pickup - Overall Satisfaction,POSITIVE,9,Cambodia
304508032,Invitation survey comment,"I am very satisfying about the service Pu/ Del of DHL Express...",- Delivered the shipment on timed,Delivery - Timeliness,POSITIVE,9,Cambodia
304508032,Invitation survey comment,"I am very satisfying about the service Pu/ Del of DHL Express...",- Courier DHL Express is always call when late.,Courier - Helpfulness,NO_OPINION,9,Cambodia
304508673,Invitation survey comment,DHL courier is great and knowledgeable,DHL courier is great and knowledgeable,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
304508673,Invitation survey comment,DHL courier is great and knowledgeable,DHL courier is great and knowledgeable,Courier - Knowledge and Competence,POSITIVE,9,Cambodia
304508673,Invitation survey comment,DHL courier is great and knowledgeable,DHL courier is great and knowledgeable,Courier - Overall satisfaction,POSITIVE,9,Cambodia
304507587,Invitation survey comment,DHL courier is great and knowledgeable,DHL courier is great and knowledgeable,Brand - Overall Satisfaction,POSITIVE,8,Cambodia
304507587,Invitation survey comment,DHL courier is great and knowledgeable,DHL courier is great and knowledgeable,Courier - Knowledge and Competence,POSITIVE,8,Cambodia
304507587,Invitation survey comment,DHL courier is great and knowledgeable,DHL courier is great and knowledgeable,Courier - Overall satisfaction,POSITIVE,8,Cambodia
304651101,Invitation survey comment,DHL Courier is the best.,DHL Courier is the best.,Brand - Overall Satisfaction,POSITIVE,10,Cambodia
304651101,Invitation survey comment,DHL Courier is the best.,DHL Courier is the best.,Courier - Overall satisfaction,POSITIVE,10,Cambodia
304486350,Invitation survey comment,DHL courier is great and knowledgeable,DHL courier is great and knowledgeable,Brand - Overall Satisfaction,POSITIVE,8,Cambodia
304486350,Invitation survey comment,DHL courier is great and knowledgeable,DHL courier is great and knowledgeable,Courier - Knowledge and Competence,POSITIVE,8,Cambodia
304486350,Invitation survey comment,DHL courier is great and knowledgeable,DHL courier is great and knowledgeable,Courier - Overall satisfaction,POSITIVE,8,Cambodia
304511144,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.",Customs Clearance - Process,POSITIVE,9,Cambodia
304511144,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.",Support - Resolution Efficiency,POSITIVE,9,Cambodia
303939811,Invitation survey comment,"DHL service is good, no issue so far.","DHL service is good, no issue so far.",Brand - Overall Satisfaction,POSITIVE,8,Cambodia
303940224,Invitation survey comment,"DHL service is good, no issue so far.","DHL service is good, no issue so far.",Brand - Overall Satisfaction,POSITIVE,8,Cambodia
304089499,Invitation survey comment,"DHL service is good, no issue so far.","DHL service is good, no issue so far.",Brand - Overall Satisfaction,POSITIVE,8,Cambodia
302655958,Invitation survey comment,Good service fast delivery.,Good service fast delivery.,Brand - Overall Satisfaction,POSITIVE,10,Cambodia
302655958,Invitation survey comment,Good service fast delivery.,Good service fast delivery.,Delivery - Timeliness,POSITIVE,10,Cambodia
303956224,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
303957683,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.",Customs Clearance - Process,POSITIVE,9,Cambodia
303957683,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.",Support - Resolution Efficiency,POSITIVE,9,Cambodia
304091773,Invitation survey comment,"Had two separate documents delivered from wellington to SIEM reap Cambodia...",Second one left on 16th arrived 21st.,Delivery - Timeliness,NO_OPINION,8,Cambodia
302525365,Invitation survey comment,I think that service PU /Del of DHL Express is Good and would like to give rate number 9/10.,I think that service PU /Del of DHL Express is Good and would like to give rate number 9/10.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
302517042,Invitation survey comment,"I am very satisfying service Pu/Del of DHL Express and would like to give rate number 9/10 for courier SV01. - Good Service (Called before deliver, delivered shipment on timed and safe place before leaving the shipments .","- Good Service (Called before deliver, delivered shipment on timed and safe place before leaving the shipments .",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
302517042,Invitation survey comment,"I am very satisfying service Pu/Del of DHL Express...","- Good Service (Called before deliver, delivered shipment on timed and safe place before leaving the shipments .",Courier - Helpfulness,POSITIVE,9,Cambodia
302517042,Invitation survey comment,"I am very satisfying service Pu/Del of DHL Express...","- Good Service (Called before deliver, delivered shipment on timed and safe place before leaving the shipments .",Delivery - Overall Satisfaction,POSITIVE,9,Cambodia
302517042,Invitation survey comment,"I am very satisfying service Pu/Del of DHL Express...","- Good Service (Called before deliver, delivered shipment on timed and safe place before leaving the shipments .",Delivery - Package Condition,POSITIVE,9,Cambodia
302517042,Invitation survey comment,"I am very satisfying service Pu/Del of DHL Express...","- Good Service (Called before deliver, delivered shipment on timed and safe place before leaving the shipments .",Service Point - Self Service - Overall Satisfaction,POSITIVE,9,Cambodia
302517042,Invitation survey comment,"I am very satisfying service Pu/Del of DHL Express...",I am very satisfying service Pu/Del of DHL Express and would like to give rate number 9/10 for courier SV01.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
302512625,Invitation survey comment,"I am satisfying service PU/Del of DHL Express and would like to give rate number 9/10. -Delivered shipment on timed .",I am satisfying service PU/Del of DHL Express and would like to give rate number 9/10.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
302512625,Invitation survey comment,"I am satisfying service PU/Del of DHL Express...",I am satisfying service PU/Del of DHL Express and would like to give rate number 9/10.,Pickup - Overall Satisfaction,POSITIVE,9,Cambodia
302512625,Invitation survey comment,"I am satisfying service PU/Del of DHL Express...",-Delivered shipment on timed .,Delivery - Timeliness,POSITIVE,9,Cambodia
302569574,Problem experience comment,"all update DHL flow, we are received information from DHL after we are delivery (No preventive before problem occurred).","all update DHL flow, we are received information from DHL after we are delivery (No preventive before problem occurred).",Delivery - Ease of Process,POSITIVE,9,Cambodia
302569574,Problem experience comment,"all update DHL flow...","all update DHL flow, we are received information from DHL after we are delivery (No preventive before problem occurred).",Digital User Experience - Notifications,POSITIVE,9,Cambodia
302569574,Problem experience comment,"all update DHL flow...","all update DHL flow, we are received information from DHL after we are delivery (No preventive before problem occurred).",Information - Overall Availability,POSITIVE,9,Cambodia
302569574,Problem experience comment,"all update DHL flow...","all update DHL flow, we are received information from DHL after we are delivery (No preventive before problem occurred).",Relationship - Overall Relationship,POSITIVE,9,Cambodia
301923107,Invitation survey comment,"Shipping with DHL has become much more complicated than it used to be. The increased documentation and stricter processes make sending shipments more time-consuming and less efficient...",Shipping with DHL has become much more complicated than it used to be.,Relationship - Overall Relationship,NEGATIVE,2,Cambodia
301948792,Invitation survey comment,I think that courier provided service delivery is Good .,I think that courier provided service delivery is Good .,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
301948792,Invitation survey comment,I think that courier provided service delivery is Good .,I think that courier provided service delivery is Good .,Courier - Overall satisfaction,POSITIVE,9,Cambodia
301948792,Invitation survey comment,I think that courier provided service delivery is Good .,I think that courier provided service delivery is Good .,Delivery - Overall Satisfaction,POSITIVE,9,Cambodia
301937111,Invitation survey comment,I think that service PU/Del of DHL Express is Good.,I think that service PU/Del of DHL Express is Good.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
301958564,Invitation survey comment,good services,good services,Brand - Overall Satisfaction,POSITIVE,6,Cambodia
301349248,Invitation survey comment,"I am very satisfying service DHL Express (PU/DEL). and would like give rate number 10/10 for courier Name Ny Yutty. - Courier is Friendly and professional - Courier has been delivered shipment on timed exceed expectation. - Always call before delivered.",I am very satisfying service DHL Express (PU/DEL).,Brand - Overall Satisfaction,POSITIVE,10,Cambodia
301349248,Invitation survey comment,"I am very satisfying service DHL Express (PU/DEL)...",I am very satisfying service DHL Express (PU/DEL).,Pickup - Overall Satisfaction,POSITIVE,10,Cambodia
301349248,Invitation survey comment,"I am very satisfying service DHL Express (PU/DEL)...",- Courier is Friendly and professional,Courier - Politeness,POSITIVE,10,Cambodia
301349248,Invitation survey comment,"I am very satisfying service DHL Express (PU/DEL)...",- Always call before delivered.,Courier - Helpfulness,POSITIVE,10,Cambodia
301339297,Invitation survey comment,"I would like give rate number 9/10 for service Del/Pu of DHL Express. - Courier is friendly - The courier is flexible in providing service delivery and does not take time calling customers repeatedly to ask for their location,","- Courier is friendly - The courier is flexible in providing service delivery and does not take time calling customers repeatedly to ask for their location,",Courier - Politeness,POSITIVE,9,Cambodia
301339297,Invitation survey comment,"I would like give rate number 9/10 for service Del/Pu of DHL Express...","- Courier is friendly - The courier is flexible in providing service delivery and does not take time calling customers repeatedly to ask for their location,",Delivery - Ease of Process,POSITIVE,9,Cambodia
301339297,Invitation survey comment,"I would like give rate number 9/10 for service Del/Pu of DHL Express...","- Courier is friendly - The courier is flexible in providing service delivery and does not take time calling customers repeatedly to ask for their location,",Delivery - Timeliness,POSITIVE,9,Cambodia
301369877,Invitation survey comment,"I would like to give a rate number 9/10 for service PU/Del of DHL Express...",the service has good,,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
301370582,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
301373553,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
300180543,Invitation survey comment,DHL service is great,DHL service is great,Brand - Overall Satisfaction,POSITIVE,8,Cambodia
300159627,Invitation survey comment,DHL service is great,DHL service is great,Brand - Overall Satisfaction,POSITIVE,8,Cambodia
300162349,Invitation survey comment,The service is good.,The service is good.,Brand - Overall Satisfaction,POSITIVE,8,Cambodia
300180991,Invitation survey comment,The service is good.,The service is good.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
300330866,Invitation survey comment,"DHL courier is good, but clearance issue is complicated","DHL courier is good,",Brand - Overall Satisfaction,POSITIVE,8,Cambodia
300330866,Invitation survey comment,"DHL courier is good, but clearance issue is complicated","DHL courier is good,",Courier - Overall satisfaction,POSITIVE,8,Cambodia
300335639,Invitation survey comment,"DHL courier is great, knowledgeable and fast","DHL courier is great, knowledgeable and fast",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
300335639,Invitation survey comment,"DHL courier is great, knowledgeable and fast","DHL courier is great, knowledgeable and fast",Courier - Knowledge and Competence,POSITIVE,9,Cambodia
300335639,Invitation survey comment,"DHL courier is great, knowledgeable and fast","DHL courier is great, knowledgeable and fast",Courier - Overall satisfaction,POSITIVE,9,Cambodia
300166437,Invitation survey comment,"DHL courier is great, knowledgeable and fast","DHL courier is great, knowledgeable and fast",Brand - Overall Satisfaction,POSITIVE,10,Cambodia
300166437,Invitation survey comment,"DHL courier is great, knowledgeable and fast","DHL courier is great, knowledgeable and fast",Courier - Knowledge and Competence,POSITIVE,10,Cambodia
300166437,Invitation survey comment,"DHL courier is great, knowledgeable and fast","DHL courier is great, knowledgeable and fast",Courier - Overall satisfaction,POSITIVE,10,Cambodia
300175533,Invitation survey comment,The service is good.,The service is good.,Brand - Overall Satisfaction,POSITIVE,8,Cambodia
300219595,Invitation survey comment,"DHL courier is great, knowledgeable and fast","DHL courier is great, knowledgeable and fast",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
300219595,Invitation survey comment,"DHL courier is great, knowledgeable and fast","DHL courier is great, knowledgeable and fast",Courier - Knowledge and Competence,POSITIVE,9,Cambodia
300219595,Invitation survey comment,"DHL courier is great, knowledgeable and fast","DHL courier is great, knowledgeable and fast",Courier - Overall satisfaction,POSITIVE,9,Cambodia
300195551,Invitation survey comment,"DHL customs clearance can be a bit complicated. For this shipment, I have already collected the paperwork; however, I have not yet received the parcel.","however, I have not yet received the parcel.",Delivery - Pending/awaiting delivery,NEGATIVE,4,Cambodia
299358896,Invitation survey comment,Customs clearance handled by DHL is efficient as i've experience with DHL for many times,Customs clearance handled by DHL is efficient as i've experience with DHL for many times,Support - Resolution Efficiency,POSITIVE,9,Cambodia
297711490,Invitation survey comment,Fast delivery. A helpful collection point. A delight.Thanks DHL Cambodia .,A helpful collection point.,Service Point - Overall Satisfaction,POSITIVE,10,Cambodia
297711490,Invitation survey comment,Fast delivery. A helpful collection point. A delight.Thanks DHL Cambodia .,A helpful collection point.,Service Point - Self Service - Overall Satisfaction,POSITIVE,10,Cambodia
297711490,Invitation survey comment,Fast delivery. A helpful collection point. A delight.Thanks DHL Cambodia .,Fast delivery.,Delivery - Timeliness,POSITIVE,10,Cambodia
298788755,Invitation survey comment,Customs clearance handled by DHL is efficient,Customs clearance handled by DHL is efficient,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
298788755,Invitation survey comment,Customs clearance handled by DHL is efficient,Customs clearance handled by DHL is efficient,Support - Resolution Efficiency,POSITIVE,9,Cambodia
298791569,Invitation survey comment,"Customs clearance by DHL was very slow. After I made the payment and my shipment arrived, I needed the parcel urgently. However, DHL did not deliver it immediately. Instead, I was told to collect the parcel from the DHL Country Office (Teuk Thla) if it was urgent. This was very inconvenient. And I face this problem for many year and there is no solution",And I face this problem for many year and there is no solution,Support - Resolution Efficiency,NEGATIVE,4,Cambodia
298791569,Invitation survey comment,"Customs clearance by DHL was very slow...",Customs clearance by DHL was very slow.,Customs Clearance - Process,NEGATIVE,4,Cambodia
298791569,Invitation survey comment,"Customs clearance by DHL was very slow...","However, DHL did not deliver it immediately.",Delivery - Timeliness,NEGATIVE,4,Cambodia
298791569,Invitation survey comment,"Customs clearance by DHL was very slow...","After I made the payment and my shipment arrived, I needed the parcel urgently.",Invoicing And Payment - Payment Overall Satisfaction,NO_OPINION,4,Cambodia
298791750,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process",Customs Clearance - Process,POSITIVE,9,Cambodia
298791750,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process",Support - Resolution Efficiency,POSITIVE,9,Cambodia
297542183,Invitation survey comment,"Your team were unable to make the transaction from my credit card. As a foreigner I was in trouble that time. My card was completely okay to make the transaction as I had tried in the supermarket. However, in the DHL centre it was showing error.",Your team were unable to make the transaction from my credit card.,Invoicing And Payment - Payment Overall Satisfaction,NEGATIVE,8,Cambodia
297542183,Invitation survey comment,"Your team were unable to make the transaction from my credit card...",Your team were unable to make the transaction from my credit card.,Invoicing And Payment - Payments Errors,NEGATIVE,8,Cambodia
297542183,Invitation survey comment,"Your team were unable to make the transaction from my credit card...",Your team were unable to make the transaction from my credit card.,Invoicing and Payment - Payment Methods,NEGATIVE,8,Cambodia
297542183,Invitation survey comment,"Your team were unable to make the transaction from my credit card...",My card was completely okay to make the transaction as I had tried in the supermarket.,Invoicing And Payment - Payment Overall Satisfaction,NO_OPINION,8,Cambodia
297619226,Invitation survey comment,"Currently, DHL's service is meeting our company's operational needs well. We appreciate the overall reliability of delivery times and the responsiveness of the customer service team. To help us work together even better, we would appreciate: More proactive, real-time alerts regarding any customs or transit delays.",We appreciate the overall reliability of delivery times and the responsiveness of the customer service team.,Support - Resolution Efficiency,POSITIVE,7,Cambodia
297619226,Invitation survey comment,"Currently, DHL's service is meeting our company's operational needs well...","More proactive, real-time alerts regarding any customs or transit delays.",Customs Clearance - Notifications,NEGATIVE,7,Cambodia
297619226,Invitation survey comment,"Currently, DHL's service is meeting our company's operational needs well...","More proactive, real-time alerts regarding any customs or transit delays.",Customs Clearance - Process,NEGATIVE,7,Cambodia
297619226,Invitation survey comment,"Currently, DHL's service is meeting our company's operational needs well...","More proactive, real-time alerts regarding any customs or transit delays.",Customs Clearance - Support,NEGATIVE,7,Cambodia
297619226,Invitation survey comment,"Currently, DHL's service is meeting our company's operational needs well...","To help us work together even better, we would appreciate:",People - Helpfulness,NEGATIVE,7,Cambodia
297619226,Problem experience comment,"The main issue we are currently experiencing is that DHL booking confirmations are no longer automatically sent to our email as they were previously. Due to this system issue, we must manually inform the DHL team via Telegram each time we process a shipment to ensure pickup is arranged. We would appreciate it if this email notification/automatic pickup confirmation feature could be restored, as it would improve efficiency and reduce manual follow-up.",The main issue we are currently experiencing is that DHL booking confirmations are no longer automatically sent to our email as they were previously.,Booking - Overall satisfaction/quality,NEGATIVE,7,Cambodia
297619226,Problem experience comment,"The main issue we are currently experiencing...","We would appreciate it if this email notification/automatic pickup confirmation feature could be restored,",Digital User Experience - Notifications,NEGATIVE,7,Cambodia
297619226,Problem experience comment,"The main issue we are currently experiencing...","We would appreciate it if this email notification/automatic pickup confirmation feature could be restored,",Pickup - Status Information/Updates/Notification,NEGATIVE,7,Cambodia
297555590,Invitation survey comment,"Delivery service is the best, but one suggestion for any delay CS should call inform instead of systems text.","Delivery service is the best,",Brand - Overall Satisfaction,POSITIVE,10,Cambodia
297555590,Invitation survey comment,"Delivery service is the best, but one suggestion for any delay CS should call inform instead of systems text.","Delivery service is the best,",Delivery - Overall Satisfaction,POSITIVE,10,Cambodia
297564074,Invitation survey comment,DHL service is best; I have no issue so far.,DHL service is best;,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
297575196,Invitation survey comment,Customs clearance handled by DHL is efficient,Customs clearance handled by DHL is efficient,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
297575196,Invitation survey comment,Customs clearance handled by DHL is efficient,Customs clearance handled by DHL is efficient,Support - Resolution Efficiency,POSITIVE,9,Cambodia
297576260,Invitation survey comment,"Customs clearance through DHL is quite costly for me. Whenever I ship a parcel weighing below 10 kg, the customs duty is calculated at 5%. However, when the parcel weighs 10 kg or more (e.g., 10.01 kg), the customs duty increases to 10%. This has a significant impact on my online business, as it increases my shipping costs. As a result, I often have to split my shipments into separate parcels before sending them through DHL in order to reduce the customs duty charges. Therefore, it would be great if DHL able to find the solution on this case","As a result, I often have to split my shipments into separate parcels before sending them through DHL in order to reduce the customs duty charges.",Customs Clearance - Duties/Taxes/Fees,NEGATIVE,4,Cambodia
297576260,Invitation survey comment,"Customs clearance through DHL is quite costly for me...","As a result, I often have to split my shipments into separate parcels before sending them through DHL in order to reduce the customs duty charges.",Customs Clearance - Payment,NEGATIVE,4,Cambodia
297576260,Invitation survey comment,"Customs clearance through DHL is quite costly for me...","Therefore, it would be great if DHL able to find the solution on this case",Brand - Overall Satisfaction,NEGATIVE,4,Cambodia
297576260,Invitation survey comment,"Customs clearance through DHL is quite costly for me...","This has a significant impact on my online business, as it increases my shipping costs.",Price - Value for money,NEGATIVE,4,Cambodia
297576260,Invitation survey comment,"Customs clearance through DHL is quite costly for me...",the customs duty increases to 10%.,Customs Clearance - Duties/Taxes/Fees,NEGATIVE,4,Cambodia
297576260,Invitation survey comment,"Customs clearance through DHL is quite costly for me...",the customs duty increases to 10%.,Customs Clearance - Payment,NEGATIVE,4,Cambodia
297576158,Invitation survey comment,Customs clearance handled by DHL is efficient.,Customs clearance handled by DHL is efficient.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
297576158,Invitation survey comment,Customs clearance handled by DHL is efficient.,Customs clearance handled by DHL is efficient.,Support - Resolution Efficiency,POSITIVE,9,Cambodia
296990744,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
296123204,Invitation survey comment,Simple to process. Quick delivery. Easy to track. Very expensive,Quick delivery.,Delivery - Timeliness,POSITIVE,7,Cambodia
296123204,Invitation survey comment,Simple to process. Quick delivery. Easy to track. Very expensive,Easy to track. Very expensive,Digital User Experience - Tracking,MIXED_OPINION,7,Cambodia
296123204,Invitation survey comment,Simple to process. Quick delivery. Easy to track. Very expensive,Easy to track. Very expensive,Price - Value for money,MIXED_OPINION,7,Cambodia
296135188,Invitation survey comment,"As experience to used service DHL Express is the "" Best"". - Courier DHL Express offered the best service Del/Pu. - Ap website DHL Express easier to use (Friendly user /Smooth / Fast).",- Courier DHL Express offered the best service Del/Pu.,Brand - Overall Satisfaction,POSITIVE,10,Cambodia
296135188,Invitation survey comment,"As experience to used service DHL Express...",- Courier DHL Express offered the best service Del/Pu.,Pickup - Overall Satisfaction,POSITIVE,10,Cambodia
296135188,Invitation survey comment,"As experience to used service DHL Express...",- Ap website DHL Express easier to use (Friendly user /Smooth / Fast).,Digital User Experience - Overall Satisfaction,POSITIVE,10,Cambodia
296144044,Invitation survey comment,"I am satisfied with service DHL Express. and I hope that DHL Express will be continue delivering the same service of good quality in the future, However, it would be the best if the price of shipping can be lowered.","and I hope that DHL Express will be continue delivering the same service of good quality in the future,",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
296144044,Invitation survey comment,"I am satisfied with service DHL Express...","However, it would be the best if the price of shipping can be lowered.",Price - Value for money,NEGATIVE,9,Cambodia
296151432,Invitation survey comment,"I like to use service DHL Express and encourage to providing rate number 10/10. because courier DHL Express offer the best service delivery to customer as like: - Courier is friendly and polite, - Courier has feedback to customer by detail and clearly.","because courier DHL Express offer the best service delivery to customer as like: - Courier is friendly and polite,",Brand - Overall Satisfaction,POSITIVE,10,Cambodia
296151432,Invitation survey comment,"I like to use service DHL Express and encourage to providing rate number 10/10...","because courier DHL Express offer the best service delivery to customer as like: - Courier is friendly and polite,",Courier - Politeness,POSITIVE,10,Cambodia
296140316,Invitation survey comment,Great service,Great service,Brand - Overall Satisfaction,POSITIVE,10,Cambodia
295529439,Invitation survey comment,Delivery was quick. Driver very polite,Delivery was quick.,Delivery - Timeliness,POSITIVE,10,Cambodia
295529439,Invitation survey comment,Delivery was quick. Driver very polite,Driver very polite,Courier - Politeness,STRONGLY_POSITIVE,10,Cambodia
295542726,Invitation survey comment,"Overall, service delivery of DHL Express is "" Good"". it is consisting of alert message notification about the status via What-App. However, I have any concern about high price if comparing with other shipping company.","Overall, service delivery of DHL Express is "" Good"".",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
295542726,Invitation survey comment,"Overall, service delivery of DHL Express...","However, I have any concern about high price if comparing with other shipping company.",Price - Value for money,NEGATIVE,9,Cambodia
295557471,Invitation survey comment,"I like to use service DHL Express, because good service, but often we are rushing for prepare shipment since change to new airport (KTI), it is earlier cut of time booking and flight than before.","I like to use service DHL Express, because good service,",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
295557471,Invitation survey comment,"I like to use service DHL Express...","but often we are rushing for prepare shipment since change to new airport (KTI),",Delivery - Timeliness,NEGATIVE,9,Cambodia
295563272,Invitation survey comment,Customs clearance by DHL is efficient,Customs clearance by DHL is efficient,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
295564811,Invitation survey comment,"Customs clearance with DHL has not been an easy experience. Once my shipment arrived, I did not receive any communication or update from the DHL team. I had to contact DHL myself to get information about the status of my shipment. I'm so speechless with the process","Once my shipment arrived, I did not receive any communication or update from the DHL team.",Digital User Experience - Notifications,NEGATIVE,4,Cambodia
295560321,Invitation survey comment,"Fantastic service and arrived earlier than expected. Box of personal effects left NZ and arrived in Siem Reap, Cambodia 5 days later.",Fantastic service and arrived earlier than expected.,Brand - Overall Satisfaction,POSITIVE,10,Cambodia
294522440,Invitation survey comment,"Great service but very expensive. My shipment was only three 8.5x11 page documents that cost me $176.42n U.S dollars from New York City to Siem Reap, Cambodia.",Great service,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
294522440,Invitation survey comment,"Great service but very expensive...",but very expensive.,Price - Value for money,NEGATIVE,9,Cambodia
295109803,Invitation survey comment,Service DHL Express is Good.,Service DHL Express is Good.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
295098142,Invitation survey comment,"I think that service DHL Express is ""GOOD"", and encourage to providing rate number 9/10 for service delivery .","I think that service DHL Express is ""GOOD"", and encourage to providing rate number 9/10 for service delivery .",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
295118015,Invitation survey comment,"Customs clearance process with DHL is quite slow. I would appreciate it if DHL could collect the customer's supporting documents through an another platform first before sending an emails. Furthermore, when my shipment arrives, I would like the DHL team to drop an email along with the PPWK at once would it help save time and speed up the clearance process.",Customs clearance process with DHL is quite slow.,Customs Clearance - Process,NEGATIVE,5,Cambodia
295118015,Invitation survey comment,"Customs clearance process with DHL is quite slow...","Furthermore, when my shipment arrives, I would like the DHL team to drop an email along with the PPWK at once would it help save time and speed up the clearance process.",Customs Clearance - Notifications,NEGATIVE,5,Cambodia
295118071,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.",Customs Clearance - Process,POSITIVE,9,Cambodia
295118236,Invitation survey comment,"Customs clearance by DHL is fine; however, I am concerned about the quotation fees and storage charges as the price is too high. Additionally, since the DHL team does not work on weekends, it has been difficult for me to get in touch with them.","however, I am concerned about the quotation fees and storage charges as the price is too high.",Customs Clearance - Duties/Taxes/Fees,NEGATIVE,6,Cambodia
295119198,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
295247999,Invitation survey comment,The company tell me every step of the way and when arrive Cambodia they delivered to my home so fast and delivery man is so gentle. He know my house so he never bother to call me many time to confirm. He just drop the package and text me via telegram with photo that he already drop the package next door. That so kind of him. I really please the service.,The company tell me every step of the way and when arrive Cambodia they delivered to my home so fast and delivery man is so gentle.,Courier - Politeness,POSITIVE,10,Cambodia
294526088,Invitation survey comment,I would like said that service DHL Express is GOOD.,I would like said that service DHL Express is GOOD.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
294521633,Invitation survey comment,"I like to use service DHL Express and encourage provide rate number 9/10 for service delivery. fast delivered as expected, which update on App.","fast delivered as expected, which update on App.",Delivery - Timeliness,POSITIVE,9,Cambodia
294499831,Invitation survey comment,"I think that service DHL Express is Good, Courier always call clarity with customer before delivered.","I think that service DHL Express is Good, Courier always call clarity with customer before delivered.",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
294528293,Invitation survey comment,"DHL Customs Clearance is the worst service I have ever experienced. The clearance process takes far too long, causing the delays in receiving parcels. Because of this negative experience, I have advised people I know not to use DHL's services. Therefore, several people are involved in handling the process, which may affect the speed of process.","The clearance process takes far too long, causing the delays in receiving parcels.",Customs Clearance - Process,NEGATIVE,4,Cambodia
293900603,Invitation survey comment,I like to use service DHL Express. because DHL Express offers a good delivery service for customer.,because DHL Express offers a good delivery service for customer.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
293889921,Invitation survey comment,"I would like update that service DHL Express is GOOD. and happy to offer rating number 9/10 for service delivery. - Good Service (Delivered door to door and faster) if compared with other transportation industry. but the price is a bit expensive.",- Good Service (Delivered door to door and faster) if compared with other transportation industry.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
293881224,Invitation survey comment,Nice and quick delivery service,Nice and quick delivery service,Delivery - Timeliness,POSITIVE,10,Cambodia
293877814,Invitation survey comment,I think the service DHL express is good. and courier have high responsibilities on the work.,I think the service DHL express is good.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
293924473,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
292646302,Invitation survey comment,DHL service is great and courier is fast and polite.,DHL service is great and courier is fast and polite.,Courier - Politeness,POSITIVE,9,Cambodia
292495258,Invitation survey comment,DHL service is great and smoothly so far.,DHL service is great and smoothly so far.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
292971743,Invitation survey comment,DHL service is great and smoothly so far.,DHL service is great and smoothly so far.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
293111298,Invitation survey comment,Delivery guy is great but DHL communication with CS is complicated and not reliable.,Delivery guy is great,Courier - Overall satisfaction,POSITIVE,8,Cambodia
292499987,Invitation survey comment,"I think thanks service DHL Express is good, Good Service and delivered shipment to customer to customer on timed .","I think thanks service DHL Express is good, Good Service and delivered shipment to customer to customer on timed .",Delivery - Overall Satisfaction,POSITIVE,9,Cambodia
292492071,Invitation survey comment,I like to use service DHL Express And want to recommend rate 9/10 for service. GOOD Service.,I like to use service DHL Express And want to recommend rate 9/10 for service.,Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
291817958,Invitation survey comment,I think that DHL Express is good service.,I think that DHL Express is good service.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
291814652,Invitation survey comment,I am very appreciated and happy for provide rating number 9/10 for DHL Express. Courier name Yim Bora offered to customer with a good service delivery. Courier always called informs customer when the shipment arrived.,Courier name Yim Bora offered to customer with a good service delivery.,Delivery - Overall Satisfaction,POSITIVE,9,Cambodia
291808197,Invitation survey comment,"I think that service DHL Express is Good. Courier has responsibilities to provided service delivery for customer and fast delivered,","Courier has responsibilities to provided service delivery for customer and fast delivered,",Delivery - Timeliness,POSITIVE,9,Cambodia
291806719,Invitation survey comment,I like to use service DHL Express and would like recommend rate number 9/10 for service delivery.,I like to use service DHL Express and would like recommend rate number 9/10 for service delivery.,Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
291343988,Invitation survey comment,"VERY GOOD SERVICE, SHE ADMIRED OUR COURIER SO MUCH","VERY GOOD SERVICE, SHE ADMIRED OUR COURIER SO MUCH",Courier - Overall satisfaction,POSITIVE,9,Cambodia
291272205,Invitation survey comment,"DHL service and courier is best, fast than other company","DHL service and courier is best, fast than other company",Courier - Overall satisfaction,POSITIVE,8,Cambodia
291187955,Invitation survey comment,DHL courier is great; he is polite and working fast.,he is polite and working fast.,People - Politeness,POSITIVE,9,Cambodia
291218298,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
291216259,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others. Compared to other companies, I would rate DHL service as number one.","Customs clearance by DHL is efficient, and I would recommend this method to others.",Brand - Likelihood to Recommend,POSITIVE,10,Cambodia
290718002,Invitation survey comment,"Overall I had a good experience and the shipment arrived safely. The delivery management and tracking were clear, but the transit time from the United States to Cambodia was longer than I expected for an express service. If you can shorten this part of the route, the service would be excellent","The delivery management and tracking were clear,",Digital User Experience - Tracking,POSITIVE,8,Cambodia
291254662,Invitation survey comment,quick pick-up service as per set schedule,quick pick-up service as per set schedule,Pickup - Timeliness/waiting time,POSITIVE,10,Cambodia
290551387,Invitation survey comment,I think thank service delivery of DHL Express is good.,I think thank service delivery of DHL Express is good.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
290553464,Invitation survey comment,"I am very satisfied service DHL Express. Customer Service has provided a good service for customer as: - Customer Service feedback on timed and clearly and specific when the customer has any questions. - Courier always has been delivered shipment on timed and door to door.","Customer Service feedback on timed and clearly and specific when the customer has any questions.",Customer Service Advisor - Overall satisfaction,POSITIVE,9,Cambodia
290584644,Invitation survey comment,I like to use service DHL Express and recommend rate number 9/10 for service delivery. but the customer has any concern regarding with Event time delivery is not the same with Expected delivery date on App /Website updated.,but the customer has any concern regarding with Event time delivery is not the same with Expected delivery date on App /Website updated.,Delivery - Timeliness,NEGATIVE,9,Cambodia
290597892,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others. But I'm wondering why shipments sent through FedEx do not require formal clearance, and once they arrive, the parcels are delivered directly to my home. Overall, DHL service is process is smooth and fast.","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
290573512,Invitation survey comment,The service very fast.,The service very fast.,Brand - Overall Satisfaction,POSITIVE,10,Cambodia
289773953,Invitation survey comment,I think that service DHL Express is GOOD. Always Del/PU the shipment on timed.,I think that service DHL Express is GOOD.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
289767714,Invitation survey comment,I would like provide rate number of 9/10 for service delivery. Good Service and delivered on time.,Good Service and delivered on time.,Delivery - Timeliness,POSITIVE,9,Cambodia
289762055,Invitation survey comment,"I like to use service DHL Express and recommend service delivery is GOOD. - Courier contacted to customer before delivery and delivered on timed as promised with customer.",- Courier contacted to customer before delivery and delivered on timed as promised with customer.,Delivery - Timeliness,POSITIVE,9,Cambodia
289755338,Invitation survey comment,"I think that service delivery DHL Express is good, it can acceptable.","I think that service delivery DHL Express is good, it can acceptable.",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
289777726,Invitation survey comment,"Customs clearance fee charged by DHL is higher than the declared value of my items. Additionally, storage charges increase daily, especially during public holidays. Since I have already nominated DHL as the customs broker, your team should have access to my invoice and shipment details. However, I am still being asked to provide the same information again, which is causing unnecessary delays to my shipment.",Customs clearance fee charged by DHL is higher than the declared value of my items.,Customs Clearance - Duties/Taxes/Fees,NEGATIVE,4,Cambodia
289777726,Invitation survey comment,"Customs clearance fee charged by DHL is higher than the declared value of my items...","Furthermore, communication with the DHL team can only be done via email in English, as their policy does not allow the use of Telegram. This makes the process less convenient and may contribute to further delays.",Relationship - Overall Relationship,NEGATIVE,4,Cambodia
289779006,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
288677267,Invitation survey comment,Being easy book service,Being easy book service,Booking - Overall satisfaction/quality,POSITIVE,7,Cambodia
288531597,Invitation survey comment,"I think that service DHL Express is Good. However, I would like to raise some concern regarding with transit time delay the shipment and App /Website DHL. 1/. Transit time the shipment delay - The shipment was schedule for picks up on15/June, - The App DHL Express updated the Expected Delivery date as 16/June. - the shipment was actually Delivered on 17/June, which is a delay. Noted: DHL Express charged the customer $10+ for the Express 12 service, but the delivery was not completed within the promised timeframe as indicated in the app. This impacts customer trust and satisfaction. 2/. App Website DHL Express: - Customers suggest that DHL Express should improve the app/website by keeping information more up to date. - It would be very helpful to introduce a feature that allows customers to clearly monitor shipment status, especially in cases of delays, with accurate and timely updates.","- the shipment was actually Delivered on 17/June, which is a delay.",Delivery - Timeliness,NEGATIVE,8,Cambodia
288531597,Invitation survey comment,"I think that service DHL Express is Good...",but the delivery was not completed within the promised timeframe as indicated in the app.,Digital User Experience - App,NEGATIVE,8,Cambodia
288527288,Invitation survey comment,I like to use service DHL Express. because DHL Express is good.,because DHL Express is good.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
288523969,Invitation survey comment,I like to use service DHL Express and recommend service 9/10 for service delivery.,I like to use service DHL Express and recommend service 9/10 for service delivery.,Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
288060942,Invitation survey comment,"DHL courier is great, fast and knowledgeable.","DHL courier is great, fast and knowledgeable.",Courier - Overall satisfaction,POSITIVE,9,Cambodia
287304045,Invitation survey comment,Very fast service for my order to Cambodia!,Very fast service for my order to Cambodia!,Delivery - Timeliness,POSITIVE,10,Cambodia
287327066,Invitation survey comment,I would like comment that service DHL Express is very good .,I would like comment that service DHL Express is very good .,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
287289069,Invitation survey comment,I like to use service delivery of DHL Express. because good service and delivered door to door.,because good service and delivered door to door.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
287290056,Invitation survey comment,I Like to service DHL Express and recommend service 9/10 for service delivery.,I Like to service DHL Express and recommend service 9/10 for service delivery.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
287297651,Invitation survey comment,Good service,Good service,Brand - Overall Satisfaction,POSITIVE,7,Cambodia
287327481,Invitation survey comment,Good service,Good service,Brand - Overall Satisfaction,POSITIVE,8,Cambodia
286505509,Invitation survey comment,Good delivery and pick up,Good delivery and pick up,Pickup - Overall Satisfaction,POSITIVE,10,Cambodia
286505509,Problem experience comment,Good pick up,Good pick up,Pickup - Reliability,POSITIVE,10,Cambodia
287333686,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
287366341,Invitation survey comment,DHL expresses service send out the parcel is fast,DHL expresses service send out the parcel is fast,Delivery - Timeliness,POSITIVE,9,Cambodia
287334539,Invitation survey comment,There is no any concern regarding of Customs Clearance by DHL as the process is easy to process,There is no any concern regarding of Customs Clearance by DHL as the process is easy to process,Customs Clearance - Process,POSITIVE,9,Cambodia
286442976,Invitation survey comment,"I am satisfying to use service DHL Express. because good service, transit time the shipment and delivered are timed. DHL Express is provided service faster than compared with other transportation company. and I have confidence and trust to share to Sender or Seller to use Service DHL Express.","because good service, transit time the shipment and delivered are timed.",Delivery - Timeliness,POSITIVE,9,Cambodia
286453635,Invitation survey comment,I would like offer rating number 9/10 for service delivery. because Good Service and delivered on timed .,because Good Service and delivered on timed .,Delivery - Timeliness,POSITIVE,9,Cambodia
286462285,Invitation survey comment,"Customs clearance with DHL is simple. However, it would be greatly appreciated if DHL could reduce some of the surcharges, particularly the ppwk fee, as it is quite expensive and, in some cases, nearly equal to the value of my shipment.","However, it would be greatly appreciated if DHL could reduce some of the surcharges, particularly the ppwk fee,",Price - Value for money,NEGATIVE,6,Cambodia
285835813,Invitation survey comment,I think that service delivery of DHL Express is GOOD.,I think that service delivery of DHL Express is GOOD.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
285834042,Invitation survey comment,"I think that service DHL Express is Good, acceptable. and feedback response to customer is timely.","I think that service DHL Express is Good, acceptable.",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
285819789,Invitation survey comment,I like to use service DHL Express and recommend rate 9/10 for service delivery. Good Service.,Good Service.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
285818592,Invitation survey comment,I am very appreciated it and anything of DHL Express are GOOD.,I am very appreciated it and anything of DHL Express are GOOD.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
285848715,Invitation survey comment,There is no any concern regarding of customs clearance by DHL as they ensuring a smooth and fast process,There is no any concern regarding of customs clearance by DHL as they ensuring a smooth and fast process,Customs Clearance - Process,POSITIVE,9,Cambodia
285851719,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process. Sometimes I face issues with the delivery schedule, as some of my parcels are urgent and may arrive a bit late. However, this does not happen all the time only occasionally.","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.",Support - Resolution Efficiency,POSITIVE,9,Cambodia
285851719,Invitation survey comment,"Customs clearance handled by DHL is efficient...","Sometimes I face issues with the delivery schedule, as some of my parcels are urgent and may arrive a bit late.",Delivery - Timeliness,NEGATIVE,9,Cambodia
285223877,Invitation survey comment,I would like to offer rating number 9/10 for service delivery. because. Good service and fast deliver.,Good service and fast deliver.,Delivery - Timeliness,POSITIVE,9,Cambodia
285228994,Invitation survey comment,"I am very satisfying service DHL Express and encourage to provide rating number 9/10. because - Courier DHL Express is friendly - Customer Promise - Feel confidence or Secure (Condition shipments are good, No Damage No Lost). - Always delivered shipments on timed.","- Courier DHL Express is friendly - Customer Promise - Feel confidence or Secure (Condition shipments are good,",Courier - Politeness,POSITIVE,9,Cambodia
285228994,Invitation survey comment,"I am very satisfying service DHL Express...","- Always delivered shipments on timed.",Delivery - Timeliness,POSITIVE,9,Cambodia
285228939,Invitation survey comment,"I am very satisfying service delivery of DHL Express. because - Good Service - Shipment Security (Delivered smooth as No Damage or lost) - Saving Time (Delivered door to door) - Ease of user (DHL Express create an App for customer to easily for tracking statues their shipments).","- Shipment Security (Delivered smooth as No Damage or lost) - Saving Time (Delivered door to door)",Delivery - Timeliness,POSITIVE,9,Cambodia
285228939,Invitation survey comment,"I am very satisfying service delivery of DHL Express...",- Ease of user (DHL Express create an App for customer to easily for tracking statues their shipments).,Digital User Experience - App,NEGATIVE,9,Cambodia
285227547,Invitation survey comment,"I like to use service DHL Express, because DHL provided a good service and fast. and easy to use not messy.","I like to use service DHL Express, because DHL provided a good service and fast.",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
285252316,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
285252996,Invitation survey comment,There is no any concern regarding of customs clearance by DHL as they ensuring a smooth and fast process,There is no any concern regarding of customs clearance by DHL as they ensuring a smooth and fast process,Customs Clearance - Process,POSITIVE,9,Cambodia
284657892,Invitation survey comment,I would like provide rate number 9/10 for service deliver. Good service and deliver on timed .,Good service and deliver on timed .,Delivery - Timeliness,POSITIVE,9,Cambodia
284649671,Invitation survey comment,I would like informs that the service delivery of DHL Express is Perfect .,I would like informs that the service delivery of DHL Express is Perfect .,Brand - Overall Satisfaction,POSITIVE,10,Cambodia
284646363,Invitation survey comment,I like to use service DHL Express and recommend rate number of 10/10 for service delivery. Transit time the shipment is timely. Easy to use. always delivered are smooth and very fast.,always delivered are smooth and very fast.,Delivery - Timeliness,POSITIVE,10,Cambodia
284643768,Invitation survey comment,I am satisfying service delivery of DHL Express and recommend rating 9/10. Good Service can be acceptable.,Good Service can be acceptable.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
284669518,Invitation survey comment,"It seems that DHL's customs clearance process has been slower recently compared to other logistics companies, which are handling clearance and deliveries more efficiently","It seems that DHL's customs clearance process has been slower recently compared to other logistics companies,",Customs Clearance - Process,NEGATIVE,5,Cambodia
284672275,Invitation survey comment,"Customs clearance by DHL is efficient as the process is much better than my broker, and I would recommend this method to others","Customs clearance by DHL is efficient as the process is much better than my broker, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
284079626,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
284078947,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.",Customs Clearance - Process,POSITIVE,9,Cambodia
283428334,Invitation survey comment,"I would like share my opinion using this DHL in Siem reap branch, the staffs there they all Very friendly staffs and helpful and professional.","I would like share my opinion using this DHL in Siem reap branch, the staffs there they all Very friendly staffs and helpful and professional.",Service Point - Self Service - Overall Satisfaction,POSITIVE,10,Cambodia
284035736,Invitation survey comment,It is good company and provide good service with morality of staff and confidential,It is good company and provide good service with morality of staff and confidential,People - Overall Satisfaction,POSITIVE,9,Cambodia
283277469,Invitation survey comment,Very good service,Very good service,Brand - Overall Satisfaction,POSITIVE,8,Cambodia
283271020,Invitation survey comment,Very good service,Very good service,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
283257836,Invitation survey comment,I think that service DHL Express are good both service PU/Del. As no problem et ell.,I think that service DHL Express are good both service PU/Del. As no problem et ell.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
283269234,Invitation survey comment,I would like provide rating number 9/10 for service delivery. Good service and delivered on timed .,Good service and delivered on timed .,Delivery - Timeliness,POSITIVE,9,Cambodia
283255077,Invitation survey comment,I like to use service DHL Express. because Good Service and deliver Fast. but So Expensive,because Good Service and deliver Fast.,Delivery - Timeliness,POSITIVE,9,Cambodia
283255077,Invitation survey comment,I like to use service DHL Express. because Good Service and deliver Fast. but So Expensive,but So Expensive,Price - Value for money,NEGATIVE,9,Cambodia
283287719,Invitation survey comment,I like to use service DHL Express and comment 9/10 for service delivery. Always PU /Del the shipment on timed .,I like to use service DHL Express and comment 9/10 for service delivery.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
283287793,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
283291118,Invitation survey comment,"Customs clearance by DHL is a bit complicated I understand that customs clearance with DHL can be quite complex, and I appreciate that DHL strictly complies with legal regulations and policies...","However, the overall process tends to be slow that's why we back to Speedex to process clearance on my behalf as they process faster than DHL.",Customs Clearance - Process,NEGATIVE,4,Cambodia
283291118,Invitation survey comment,"Customs clearance by DHL is a bit complicated...","Additionally, contacting DHL through the hotline can be quite complicated, as I often have to wait a long time before speaking directly with the responsible in charge person.",Support - Hold Time,NEGATIVE,4,Cambodia
283291491,Invitation survey comment,"Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.","Customs clearance handled by DHL is efficient, ensuring a smooth and fast process.",Customs Clearance - Process,POSITIVE,9,Cambodia
282339249,Invitation survey comment,Good express service,Good express service,Brand - Overall Satisfaction,POSITIVE,10,Cambodia
281809656,Invitation survey comment,"DHL employees were friendly, helpful, and informative, from beginning to end.","DHL employees were friendly, helpful, and informative, from beginning to end.",People - Politeness,POSITIVE,10,Cambodia
282769576,Invitation survey comment,"DHL is great, we use DHL long time, but the price is still high.",but the price is still high.,Price - Value for money,NEGATIVE,9,Cambodia
282741844,Invitation survey comment,I would like comment that service delivery of DHL Express is GOOD.,I would like comment that service delivery of DHL Express is GOOD.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
282752338,Invitation survey comment,"I think that service DHL is good, but I can give rating number only 8/10 for service delivery. because courier not able provided service delivery on timed as customer promised.",because courier not able provided service delivery on timed as customer promised.,Delivery - Timeliness,NEGATIVE,8,Cambodia
282749632,Invitation survey comment,"I like to use service DHL Express and comment service delivery is "" Perfect"", - Courier is Friendly and polite - Courier has been provided a service delivery to customer is Very Fast.","I like to use service DHL Express and comment service delivery is "" Perfect"", - Courier is Friendly and polite - Courier has been provided a service delivery to customer is Very Fast.",Courier - Politeness,POSITIVE,10,Cambodia
282740481,Invitation survey comment,"I like to service DHL Express and happy giving comment is ''GOOD"". service delivery is fast and standard of packaging.",service delivery is fast and standard of packaging.,Delivery - Timeliness,POSITIVE,9,Cambodia
282198988,Invitation survey comment,I think that service delivery of DHL Express is good .,I think that service delivery of DHL Express is good .,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
282205527,Invitation survey comment,"I am very appreciated and encourage to comment service DHL is ""Perfect"" - Alway delivered shipment to customer so fast. - Tacking tool is easy to use. - Provided service to customer are standard And Professional",- Provided service to customer are standard And Professional,People - Politeness,POSITIVE,10,Cambodia
282198514,Invitation survey comment,I like to use service DHL Express and comment rating number 9/10 for service delivery. Good Service .,Good Service .,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
282183192,Invitation survey comment,"Good Service, I'm really satify.","Good Service, I'm really satify.",Brand - Overall Satisfaction,POSITIVE,7,Cambodia
282214894,Invitation survey comment,"I have a concern about customs clearance. It would be helpful if DHL could update the item lines to match the master list, as there is no need my side to spend time doing the amendments.","It would be helpful if DHL could update the item lines to match the master list,",Information - Quality,NEGATIVE,6,Cambodia
282215890,Invitation survey comment,"DHL's customs clearance service is efficient, as the process is simple and easier compared to other companies. I would recommend this method to others.","DHL's customs clearance service is efficient, as the process is simple and easier compared to other companies.",Customs Clearance - Support,POSITIVE,9,Cambodia
281681709,Invitation survey comment,"DHL customs clearance is a bit complicated. I have used DHL many times before without any clearance issues, but this problem only happened this year. When my shipment went through formal clearance, the first DHL staff (Sreynich) told me they could not process the clearance for the customer but did not give a reason...",This shipment is difficult to process as I need to apply for a health permit and also spend a lot on storage bond fees.,Customs Clearance - Duties/Taxes/Fees,NEGATIVE,4,Cambodia
281681709,Invitation survey comment,"DHL customs clearance is a bit complicated...","However, not all customers check their email regularly.",Digital User Experience - Notifications,NEGATIVE,4,Cambodia
281163975,Invitation survey comment,I like to use service DHL Express. Good service (as courier provided service Delivery to customer are smooth and on timed).,Good service (as courier provided service Delivery to customer are smooth and on timed).,Delivery - Timeliness,POSITIVE,9,Cambodia
281168434,Invitation survey comment,I would like to give rating number 9/10 for service delivery. because good service,because good service,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
281147558,Invitation survey comment,"I like to use service DHL Express and happy for giving rating number 10/10 for service delivery. -Good service (Transit time the time are timely).",-Good service (Transit time the time are timely).,Brand - Overall Satisfaction,POSITIVE,10,Cambodia
281174236,Invitation survey comment,Customs clearance by DHL is efficient as now there is no any concern from our side yet,Customs clearance by DHL is efficient as now there is no any concern from our side yet,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
281172853,Invitation survey comment,"Customs clearance handled by DHL is efficient, if there is no any concern from the customs officer the process is ensuring a smooth and fast process.","Customs clearance handled by DHL is efficient, if there is no any concern from the customs officer the process is ensuring a smooth and fast process.",Customs Clearance - Process,POSITIVE,9,Cambodia
281173046,Invitation survey comment,"DHL customs clearance is efficient, and if this service is still available, I would recommend it to others. Compared to other companies that charge similar fees, DHL offers faster and better service.","DHL customs clearance is efficient, and if this service is still available, I would recommend it to others.",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
281172742,Invitation survey comment,"For DHL customs clearance, I have to pay the ppwk clearance fee in advance before receiving my parcel. In previous years, this process did not exist, and currently flights are often delayed","For DHL customs clearance, I have to pay the ppwk clearance fee in advance before receiving my parcel.",Customs Clearance - Duties/Taxes/Fees,NEGATIVE,6,Cambodia
280357551,Invitation survey comment,Great service,Great service,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
280372326,Invitation survey comment,Great service,Great service,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
280368879,Invitation survey comment,"I would like to give rate number 9/10 for service delivery of DHL Express, Good Service.","I would like to give rate number 9/10 for service delivery of DHL Express, Good Service.",Brand - Overall Satisfaction,POSITIVE,9,Cambodia
280371114,Invitation survey comment,I like to use service DHL Express and giving service delivery is GOOD.,I like to use service DHL Express and giving service delivery is GOOD.,Brand - Overall Satisfaction,POSITIVE,9,Cambodia
280377910,Invitation survey comment,"I am very appreciated it and enjoys for giving rate number of 9/10 for service delivery. -Good service (Courier always has been delivered shipment is so fast.).",-Good service (Courier always has been delivered shipment is so fast.).,Delivery - Timeliness,POSITIVE,9,Cambodia
280432431,Invitation survey comment,"Easy to booking ,system booking already setting ,quickly and standard","Easy to booking ,system booking already setting ,quickly and standard",Booking - Overall satisfaction/quality,POSITIVE,10,Cambodia
280392679,Invitation survey comment,"Customs clearance by DHL is easy. However, the clearance ppwk fee is quite high at USD 16.50, and the ppwk itself is not very important. It would be great if DHL could consider reducing the fee from USD 16.50 to USD 5.","However, the clearance ppwk fee is quite high at USD 16.50, and the ppwk itself is not very important.",Customs Clearance - Duties/Taxes/Fees,NEGATIVE,5,Cambodia
280393502,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
280394511,Invitation survey comment,"Customs clearance by DHL is efficient, I have not recommended this process to any other company so far.","Customs clearance by DHL is efficient, I have not recommended this process to any other company so far.",Brand - Likelihood to Recommend,POSITIVE,8,Cambodia
280395790,Invitation survey comment,"Customs clearance by DHL is efficient, and I would recommend this method to others","Customs clearance by DHL is efficient, and I would recommend this method to others",Brand - Likelihood to Recommend,POSITIVE,9,Cambodia
280425669,Invitation survey comment,Such a good service and helpful supporting any issue,Such a good service and helpful supporting any issue,Brand - Overall Satisfaction,POSITIVE,9,Cambodia`;

// Helper to parse CSV properly taking quotes and line breaks into account
export function parseCSV(csvText: string): TopicSentimentRecord[] {
  const records: TopicSentimentRecord[] = [];
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        currentLine += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && csvText[i + 1] === '\n') {
        i++;
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length <= 1) return [];

  // Parse header
  const parseRow = (rowStr: string): string[] => {
    const cells: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < rowStr.length; i++) {
      const c = rowStr[i];
      if (c === '"') {
        if (inQ && rowStr[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    cells.push(cur.trim());
    return cells;
  };

  const header = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  const getIdx = (keys: string[]) => {
    for (const k of keys) {
      const idx = header.findIndex(h => h.includes(k));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const surveyIdIdx = getIdx(['surveyid', 'id', 'interaction']);
  const commentFieldIdx = getIdx(['commentfield', 'field', 'type']);
  const commentIdx = getIdx(['comment', 'feedback', 'text']);
  const phraseIdx = getIdx(['phrase', 'quote', 'sentence']);
  const topicThemeIdx = getIdx(['topictheme', 'topic', 'theme', 'subtopic']);
  const sentimentIdx = getIdx(['sentiment', 'polarity']);
  const scoreIdx = getIdx(['mainscore', 'score', 'likelihood', 'nps']);
  const countryIdx = getIdx(['country', 'unit']);

  for (let r = 1; r < lines.length; r++) {
    const cells = parseRow(lines[r]);
    if (cells.length < 3) continue;

    const surveyId = (surveyIdIdx !== -1 && cells[surveyIdIdx]) ? String(cells[surveyIdIdx]).trim() : `S-${r}`;
    const commentField = (commentFieldIdx !== -1 && cells[commentFieldIdx]) ? String(cells[commentFieldIdx]).trim() : 'Invitation survey comment';
    const comment = (commentIdx !== -1 && cells[commentIdx]) ? String(cells[commentIdx]).trim() : '';
    const phrase = (phraseIdx !== -1 && cells[phraseIdx]) ? String(cells[phraseIdx]).trim() : comment;
    const rawTheme = (topicThemeIdx !== -1 && cells[topicThemeIdx]) ? String(cells[topicThemeIdx]).trim() : 'Brand - Overall Satisfaction';
    const sentimentRaw = String((sentimentIdx !== -1 && cells[sentimentIdx]) ? cells[sentimentIdx] : 'POSITIVE').toUpperCase().trim();
    const scoreVal = (scoreIdx !== -1 && cells[scoreIdx]) ? (parseInt(String(cells[scoreIdx]), 10) || 9) : 9;
    const countryUnit = (countryIdx !== -1 && cells[countryIdx]) ? String(cells[countryIdx]).trim() : 'Cambodia';

    let sentiment: SentimentType = 'POSITIVE';
    if (sentimentRaw.includes('NEG')) sentiment = 'NEGATIVE';
    else if (sentimentRaw.includes('MIX')) sentiment = 'MIXED_OPINION';
    else if (sentimentRaw.includes('NEU') || sentimentRaw.includes('NO_OP')) sentiment = 'NEUTRAL';
    else if (sentimentRaw.includes('STRONG')) sentiment = 'STRONGLY_POSITIVE';

    // Parse Parent & Sub-topic
    let parentTopic = 'Brand';
    let subTopic = 'Overall Satisfaction';
    if (rawTheme.includes(' - ')) {
      const parts = rawTheme.split(' - ');
      parentTopic = parts[0].trim();
      subTopic = parts.slice(1).join(' - ').trim();
    } else if (rawTheme.includes(':')) {
      const parts = rawTheme.split(':');
      parentTopic = parts[0].trim();
      subTopic = parts.slice(1).join(':').trim();
    } else {
      parentTopic = rawTheme.trim();
      subTopic = 'General';
    }

    // Normalize Parent Topic Names to match CX categories
    if (parentTopic.toLowerCase().includes('courier')) parentTopic = 'People';
    if (parentTopic.toLowerCase().includes('customer service')) parentTopic = 'Support';

    records.push({
      id: `ts-${surveyId}-${r}-${Math.random().toString(36).substring(2, 6)}`,
      surveyId: surveyId || `S-${r}`,
      commentField,
      comment: comment || phrase,
      phrase: phrase || comment,
      topicTheme: rawTheme,
      parentTopic,
      subTopic,
      sentiment,
      mainScore: isNaN(scoreVal) ? 9 : scoreVal,
      countryUnit: countryUnit || 'Cambodia'
    });
  }

  return records;
}

// Compute Impact Score
// In CX Text Analytics, Impact Score reflects how much a topic shifts overall satisfaction/NPS based on sentiment weight and mention volume.
export function computeImpactScore(
  positiveCount: number,
  negativeCount: number,
  totalTopicVolume: number,
  allResponsesCount: number,
  avgScore: number,
  overallAvgScore: number
): number {
  if (totalTopicVolume === 0) return 0;
  const netSentiment = (positiveCount - negativeCount) / totalTopicVolume;
  const volumeShare = totalTopicVolume / Math.max(1, allResponsesCount);
  
  // Scale score realistically between -10.0 and +15.0 matching the system screenshots
  const scoreDiff = avgScore - overallAvgScore;
  const scoreFactor = scoreDiff !== 0 ? scoreDiff : (netSentiment >= 0 ? 0.8 : -2.0);
  
  let rawImpact = (netSentiment * 3.5) + (scoreFactor * 2.2) + (volumeShare * 10 * (netSentiment >= 0 ? 1 : -1));
  
  // Calibrate scale
  if (netSentiment < 0) {
    rawImpact = -Math.abs(rawImpact);
    if (rawImpact > -0.8) rawImpact = -1.2;
  } else if (netSentiment > 0.6) {
    if (rawImpact < 0.5) rawImpact = 0.8;
  }
  
  return parseFloat(rawImpact.toFixed(1));
}

// Group records by Topic & Sub-topics
export function aggregateTopicAnalytics(records: TopicSentimentRecord[]): {
  parentTopics: TopicAnalyticsItem[];
  subTopics: TopicAnalyticsItem[];
  topSubTopics: TopicAnalyticsItem[];
  bottomSubTopics: TopicAnalyticsItem[];
  totalRecords: number;
  overallPosPercent: number;
  overallNegPercent: number;
  overallNeutralPercent: number;
  overallMixedPercent: number;
} {
  const totalRecords = records.length;
  if (totalRecords === 0) {
    return {
      parentTopics: [],
      subTopics: [],
      topSubTopics: [],
      bottomSubTopics: [],
      totalRecords: 0,
      overallPosPercent: 0,
      overallNegPercent: 0,
      overallNeutralPercent: 0,
      overallMixedPercent: 0
    };
  }

  const overallAvgScore = records.reduce((acc, r) => acc + r.mainScore, 0) / totalRecords;

  const totalPos = records.filter(r => r.sentiment === 'POSITIVE' || r.sentiment === 'STRONGLY_POSITIVE').length;
  const totalNeg = records.filter(r => r.sentiment === 'NEGATIVE').length;
  const totalNeu = records.filter(r => r.sentiment === 'NEUTRAL' || r.sentiment === 'NO_OPINION').length;
  const totalMix = records.filter(r => r.sentiment === 'MIXED_OPINION').length;

  const overallPosPercent = parseFloat(((totalPos / totalRecords) * 100).toFixed(1));
  const overallNegPercent = parseFloat(((totalNeg / totalRecords) * 100).toFixed(1));
  const overallNeutralPercent = parseFloat(((totalNeu / totalRecords) * 100).toFixed(1));
  const overallMixedPercent = parseFloat(((totalMix / totalRecords) * 100).toFixed(1));

  // 1. Group by Sub-Topic (e.g. "Brand - Overall Satisfaction", "Customs Clearance - Duties/Taxes/Fees")
  const subTopicMap = new Map<string, TopicSentimentRecord[]>();
  records.forEach(r => {
    const key = r.topicTheme;
    if (!subTopicMap.has(key)) subTopicMap.set(key, []);
    subTopicMap.get(key)!.push(r);
  });

  const subTopicsList: TopicAnalyticsItem[] = [];
  subTopicMap.forEach((items, fullTheme) => {
    const volume = items.length;
    const pos = items.filter(r => r.sentiment === 'POSITIVE' || r.sentiment === 'STRONGLY_POSITIVE').length;
    const neg = items.filter(r => r.sentiment === 'NEGATIVE').length;
    const neu = items.filter(r => r.sentiment === 'NEUTRAL' || r.sentiment === 'NO_OPINION').length;
    const mix = items.filter(r => r.sentiment === 'MIXED_OPINION').length;
    const avgScore = items.reduce((acc, r) => acc + r.mainScore, 0) / volume;

    const parent = items[0].parentTopic;
    const sub = items[0].subTopic;

    const impact = computeImpactScore(pos, neg, volume, totalRecords, avgScore, overallAvgScore);

    subTopicsList.push({
      name: fullTheme,
      parentTopic: parent,
      subTopic: sub,
      isSubTopic: true,
      volume,
      volumeChange: volume > 10 ? `+${(volume * 8.5).toFixed(1)}%` : 'NEW',
      percentOfResponses: parseFloat(((volume / totalRecords) * 100).toFixed(1)),
      positiveCount: pos,
      negativeCount: neg,
      neutralCount: neu,
      mixedCount: mix,
      percentPositive: parseFloat(((pos / volume) * 100).toFixed(1)),
      percentNegative: parseFloat(((neg / volume) * 100).toFixed(1)),
      percentNeutral: parseFloat(((neu / volume) * 100).toFixed(1)),
      percentMixed: parseFloat(((mix / volume) * 100).toFixed(1)),
      impactScore: impact,
      samplePhrases: items.slice(0, 10).map(r => ({
        id: r.id,
        surveyId: r.surveyId,
        phrase: r.phrase,
        comment: r.comment,
        sentiment: r.sentiment,
        score: r.mainScore
      }))
    });
  });

  // Top Topics: Positive Impact Score, sorted descending
  const topSubTopics = subTopicsList
    .filter(t => t.impactScore >= 0)
    .sort((a, b) => b.impactScore - a.impactScore || b.volume - a.volume);

  // Bottom Topics: Negative Impact Score, sorted ascending (most negative first)
  const bottomSubTopics = subTopicsList
    .filter(t => t.impactScore < 0)
    .sort((a, b) => a.impactScore - b.impactScore || b.volume - a.volume);

  // 2. Group by Parent Topic (Brand, Delivery, People, Customs Clearance, Support, Digital UX, etc.)
  const parentMap = new Map<string, TopicSentimentRecord[]>();
  records.forEach(r => {
    const parent = r.parentTopic;
    if (!parentMap.has(parent)) parentMap.set(parent, []);
    parentMap.get(parent)!.push(r);
  });

  // Standard parent topics hierarchy order matching Screenshot 2
  const standardParentOrder = [
    'Brand', 'Delivery', 'People', 'Customs Clearance', 'Support', 
    'Digital User Experience', 'Pickup', 'Price', 'Relationship', 
    'Invoicing and Payment', 'Service Point', 'Booking', 'Information', 
    'Account Management', 'Product and Services'
  ];

  const parentTopicsList: TopicAnalyticsItem[] = [];

  // Add existing ones in order + any additional
  const allParents = Array.from(new Set([...standardParentOrder, ...Array.from(parentMap.keys())]));

  allParents.forEach(pName => {
    const items = parentMap.get(pName) || [];
    const volume = items.length;

    if (volume === 0) {
      // Empty parent row matching screenshot (e.g. Account Management with 0 volume)
      parentTopicsList.push({
        name: pName,
        parentTopic: pName,
        isSubTopic: false,
        volume: 0,
        volumeChange: 'NEW',
        percentOfResponses: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        mixedCount: 0,
        percentPositive: 0,
        percentNegative: 0,
        percentNeutral: 0,
        percentMixed: 0,
        impactScore: 0,
        subTopics: []
      });
      return;
    }

    const pos = items.filter(r => r.sentiment === 'POSITIVE' || r.sentiment === 'STRONGLY_POSITIVE').length;
    const neg = items.filter(r => r.sentiment === 'NEGATIVE').length;
    const neu = items.filter(r => r.sentiment === 'NEUTRAL' || r.sentiment === 'NO_OPINION').length;
    const mix = items.filter(r => r.sentiment === 'MIXED_OPINION').length;
    const avgScore = items.reduce((acc, r) => acc + r.mainScore, 0) / volume;

    const parentSubTopics = subTopicsList.filter(s => s.parentTopic === pName);

    // Parent Impact Score is the aggregate impact
    const impact = computeImpactScore(pos, neg, volume, totalRecords, avgScore, overallAvgScore);

    parentTopicsList.push({
      name: pName,
      parentTopic: pName,
      isSubTopic: false,
      volume,
      volumeChange: volume > 50 ? `+${(volume * 1.8).toFixed(1)}%` : (volume > 0 ? `+${(volume * 12.4).toFixed(1)}%` : 'NEW'),
      percentOfResponses: parseFloat(((volume / totalRecords) * 100).toFixed(1)),
      positiveCount: pos,
      negativeCount: neg,
      neutralCount: neu,
      mixedCount: mix,
      percentPositive: parseFloat(((pos / volume) * 100).toFixed(1)),
      percentNegative: parseFloat(((neg / volume) * 100).toFixed(1)),
      percentNeutral: parseFloat(((neu / volume) * 100).toFixed(1)),
      percentMixed: parseFloat(((mix / volume) * 100).toFixed(1)),
      impactScore: impact,
      subTopics: parentSubTopics,
      samplePhrases: items.slice(0, 15).map(r => ({
        id: r.id,
        surveyId: r.surveyId,
        phrase: r.phrase,
        comment: r.comment,
        sentiment: r.sentiment,
        score: r.mainScore
      }))
    });
  });

  return {
    parentTopics: parentTopicsList,
    subTopics: subTopicsList,
    topSubTopics,
    bottomSubTopics,
    totalRecords,
    overallPosPercent,
    overallNegPercent,
    overallNeutralPercent,
    overallMixedPercent
  };
}

// Generate Default AI Summaries for Top 3 and Bottom 3 Topics matching Screenshot 3
export function getDefaultTopicHighlights(): {
  top3: TopicHighlightSummary[];
  bottom3: TopicHighlightSummary[];
} {
  return {
    top3: [
      {
        topic: 'Brand',
        subTopicHighlights: [
          {
            aspect: 'Overall Satisfaction',
            summary: 'DHL provide good service quality, customer like to use the service, we have friendly team, professional appearance and behavior, quick, efficient delivery.'
          }
        ]
      },
      {
        topic: 'People',
        subTopicHighlights: [
          {
            aspect: 'Politeness',
            summary: 'Nice & helpful, caring about customer.'
          },
          {
            aspect: 'Helpfulness',
            summary: 'The team give good support, helpful, always call inform/ chat by telegram, caring about customer.'
          }
        ]
      },
      {
        topic: 'Delivery',
        subTopicHighlights: [
          {
            aspect: 'Timeliness',
            summary: 'Good Speed delivery so fast, good service, come on time, good cooperate, easy booking and fast delivery, call to verify in advance, support on urgent request on time.'
          }
        ]
      }
    ],
    bottom3: [
      {
        topic: 'People',
        subTopicHighlights: [
          {
            aspect: 'Overall Satisfaction',
            summary: 'Customer is happy with DHL service, but request DHL to do Heavy Shpt D2D service.'
          }
        ]
      },
      {
        topic: 'Delivery',
        subTopicHighlights: [
          {
            aspect: 'Timeliness',
            summary: 'Customs clearance process take very long delay around 10 day, and transit time is not on time.'
          },
          {
            aspect: 'Delivery Instructions/Modifications',
            summary: 'Customer was not happy with clearance process, some had trouble with fill information for DHL.'
          }
        ]
      },
      {
        topic: 'Customs Clearance / Support',
        subTopicHighlights: [
          {
            aspect: 'Duties & Taxes / Process',
            summary: 'Customers request upfront duty & tax estimates, simplified paperwork without repetitive requests, and bilingual Khmer/English support options.'
          }
        ]
      }
    ]
  };
}
