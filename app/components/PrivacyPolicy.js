"use client";

import { Box, Typography } from "@mui/material";

export default function PrivacyPolicy() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography color="secondary.main">
        This Privacy Policy explains how we collect, use, disclose, and
        safeguard your information when you use our services. We are committed
        to protecting your personal information and your right to privacy.
      </Typography>

      <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
        AMENDMENTS OF PICK-UP AND DELIVERY POLICY
      </Typography>

      <ol style={{ paddingLeft: 20, margin: 0, display: "grid", gap: 8 }}>
        <li>
          You may amend or cancel 60 minutes before the pick-up time specified
          in the confirmation receipt.
        </li>
        <li>
          Staff- Our services are performed and delivered by our
          staff/employee under employment. Some of our services could be
          sub-contracted by us to such courier as we nominate or contracted from
          time to time.
        </li>
        <li>
          Baggage- The baggage must not exceed the number of cases per client,
          weight, dimensions specified on baggage limitation. Any baggage that
          exceeds the maximum number per client is subject for additional cost.
          Our company will not be liable for damage of any baggage labeled as
          “fragile” as our company is not the first handler or receiver of the
          baggage.
        </li>
        <li>
          Our company shall not be liable for loss, damage, delay, arising from
          Act of God, force majeure, Acts of Government Authority or shippers
          breach of contract.
        </li>
        <li>
          Our liability for loss damage, or delay shall be as follows:
          <ol style={{ paddingLeft: 20, marginTop: 8, display: "grid", gap: 8 }}>
            <li>
              For lost, damaged baggage liability shall only be limited to
              refund of the delivery fee
            </li>
            <li>
              For delay in the delivery liability shall only be limited to
              refund or amount of delivery fee.
            </li>
          </ol>
        </li>
        <li>
          Our company will transport the baggage from the pick-up point/
          collection point to the delivery point. The pick-up and delivery point
          can be an airport, Hotel, or Home address.
        </li>
        <li>
          No pick-up and delivery will be accepted if the pick-up point and
          delivery point is inter Island, port, train station or an area in
          which we do not provide services.
        </li>
        <li>
          The client must ensure that the baggage is available for pick-up to
          the delivery point at the time frame specified in the confirmation
          receipt.
        </li>
        <li>
          Our company will deliver the baggage from the pick-up point to the
          delivery point by the delivery time and delivery date specified in the
          confirmation.
        </li>
        <li>
          We will only be release the baggage to the person/company we
          reasonably believe to be the addressee specified in the confirmation
          receipt or to any other person to have written authority on behalf of
          the client (such person at the same premises as the client, hotel
          lobby or concierge as such please specify the name of the person the
          room of the hotel is booked under.
        </li>
        <li>
          A surcharge, any cost we or the subcontractor may incur in storing,
          forwarding, disposing of, or returning the bag or any changes if any
          for making a second or further delivery attempt, returning the baggage
          to you and/or for the agreed appropriate action.
        </li>
        <li>
          If we are unable to deliver the baggage because of an incorrect
          address we will make reasonable efforts to find correct delivery
          point. We will notify you of the correction and we will deliver or
          attempt the baggage to the correct delivery point.
        </li>
        <li>
          Neither we nor the subcontractor accept any responsibility in any
          cases /circumstances for the suspension of carriage, redirected
          delivery whether to a different address from that stated in the
          confirmation receipt, return of the bag to you and, in the event that
          the delivery team should attempt but fail to do so, neither we or the
          subcontractor shall have any liability for losses occasioned thereby.
        </li>
        <li>
          We will provide you a confirmation receipt and delivery receipt of
          every baggage delivered thru your official email.
        </li>
        <li>Billing is every 15TH day of each month.</li>
      </ol>
    </Box>
  );
}