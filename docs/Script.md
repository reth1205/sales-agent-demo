Context Setup

Setting: A Sales person is in their truck headed to a customer meeting, this is one of several planned meetings for the day.

Sales Professional (SP): Marcus (Hilti Account Manager)

Customer: Apex Construction (Commercial Contractor)

Contact: Sarah Jenkins (Lead Project Manager)

Admin Setting: AISA is configured by the regional sales admin to pull and summarize data from the past 90 days. The admin has mandated that AISA brief the SP on specific data points: Contact Info, Last Contact, Recent Discussions, Open Opportunities, Open Tasks, Credit Updates, and External Insights/Important Details.

Source data: CRM (ex: Salesforce), external sources (ex: internet, LinkedIn, etc), customer data sources (ex: Dun and Bradstreet, Zoominfo)

Location: Marcus is driving his truck, approaching the job site.

Part 1: Pre-Meeting Briefing (The Drive In)

Context: The GPS detects Marcus is within a 5-mile radius of the Apex Construction job site. The app seamlessly interrupts the radio.

AISA:(Audio prompt chimes) "Hi Marcus, you are five miles from your 10:00 AM appointment with Apex Construction. Based on your admin's settings, I have compiled a 90-day summary covering credit updates, recent communications, open opportunities, and external insights. Would you like your account briefing?"

Marcus: "Yes, let's hear it."

AISA:(Source: Salesforce - Financial & Credit Update) "Apex Construction is a Tier 2 account. Important: Their account currently has a credit hold due to a 45-day overdue invoice of $4,200. (Source: Salesforce - Contact Info & Recent Discussions) You are meeting with Sarah Jenkins. Your last email exchange with her was 14 days ago regarding a field demo of the TE 70-ATC Combihammer. (Source: Salesforce - Open Opportunities & Tasks) You have one active opportunity for a tool fleet management contract upgrade, currently in the 'Proposal' stage. (Source: External Data Integration - LinkedIn Sales Navigator) Under important details, I see on LinkedIn they just hired two new project superintendents this week and won the bid for the Riverfront High School expansion. This could be a highly profitable opportunity for new equipment. (Source: AISA Logic - CRM Data Gap Analysis) Based on this data, I have generated four Call Objectives for this meeting:

Address the $4,200 past-due invoice to release the credit hold.

Get feedback on the TE 70-ATC demo.

Identify the final decision date for the fleet management contract.

Congratulate Sarah on the Riverfront project and uncover tooling needs for the new superintendents. Do you need any additional details?"

Marcus: "Yeah, AISA. What exactly was that overdue invoice for?"

AISA:(Source: Salesforce - Invoicing/Order History) "That invoice was generated on July 5th for a bulk order of HST3 expansion anchors and chemical sealants delivered to the Downtown Plaza project."

Marcus: "Got it. Did Sarah mention who the decision-maker is for the fleet contract in our last notes?"

AISA:(Source: Salesforce - Opportunity Contact Roles) "Yes. In your meeting notes from 60 days ago, Sarah indicated that the Regional Operations Director, David Cho, must sign off on any fleet upgrades."

Marcus: "Perfect, thanks. End briefing."

Part 2: Post-Meeting Debrief (The Drive Out)

Context: The meeting has ended. Marcus gets back into his Hilti truck, turns on the ignition, and opens the app. There is a visualization on the app. If the user was parked and in the app, they would see an open list of open topics that the AISA is trying to fulfill. As they are being satisfied, they have visuals to show (show a full process) of the topic not satisfied, partially satisfied or fully satisfied, like a status complete indication, using some sort of color wheel or check mark. I would also like a visualization of this. 

Marcus: "Hey AISA, can we update my account?"

AISA:(Source: App Interface) "Absolutely, Marcus. Let's debrief on Apex Construction. Did you get a chance to address the overdue $4,200 invoice?"

Marcus: "Yes. Sarah said their accounts payable department simply missed it during a software migration. She emailed them while I was sitting there, and they are cutting the check on Friday."

AISA:(Source: AISA Logic / Speech-to-Text) "Great. I will update the account notes and set a task for you to verify the payment on Monday. How did she like the TE 70-ATC Combihammer demo?"

Marcus: "She loved it. Her crew said the active torque control saved a guy's wrist yesterday when it bound up in some rebar. She wants to buy three of them."

AISA:(Source: AISA Logic) "That's excellent. I am creating a new closed-won opportunity for three TE 70-ATCs. Did she give you a timeline on the fleet management contract upgrade?"

Marcus: "Yeah, but it's delayed. David Cho is on leave until the end of next month, so they won't be making a decision until Q4."

AISA:(Source: AISA Logic) "Understood. I will push the close date for the fleet opportunity to October 15th and log David Cho's absence in the notes. Finally, did you get to ask about the Riverfront project and the new hires?"

Marcus: "I did. Good catch on that. The two new superintendents are starting next week and they are completely bare on tools. Set up a new opportunity for two of our standard 'Heavy Commercial' truck packages, and remind me to email her the pricing sheets tomorrow morning."

AISA:(Source: AISA Logic & Salesforce API) "Done. I have created a new opportunity for two Heavy Commercial truck packages and scheduled an email task for tomorrow morning. Is there anything else you'd like me to add to Salesforce for this visit?"

Marcus: "No, that's it. Log the call."

AISA:(Source: Salesforce API) "Call logged, CRM updated, and your follow-up tasks are scheduled. Have a safe drive to your next stop, Marcus."

If the admin wanted to add a specific "Competitor Activity" module to this data pull, how would you like AISA to phrase questions about rival tool brands during the post-meeting debrief?

AI Generated example:

Note: AISA should be available to brief on any topics at any time.
