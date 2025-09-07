"use client";

import { Box, Typography } from "@mui/material";

export default function TermsAndConditions() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

      <ol style={{ paddingLeft: 20, margin: 0, display: "grid", gap: 8 }}>
        <li>
          The service all delivery is subject to acceptance by us by issuing a
          receipt confirming that the service delivery has been accepted. Our
          office, in respect of a particular baggage delivery request will only
          be formed when we issue you the confirmation thru email or text
          message.
        </li>
        <li>
          Our company reserves the right, at our sole discretion, to reject
          delivery of your baggage for any reason whatsoever, including without
          the limitation, where the pick-up point and/or delivery point fall
          within an area which we do not provide the services.
        </li>
        <li>
          We will not oblige to supply any other services in respect of baggage
          delivery until the provisions of such services have been confirmed in a
          separate confirmation.
        </li>
        <li>
          Our services shall be limited to the collection/pick-up,
          transportation and delivery of the baggage referred to in the
          confirmation receipt. This service may include additional services as
          ordered request by the client and supplied by us i.e cling film
          wrapping etc.
        </li>
      </ol>
      
    </Box>
  );
}


