import { Suspense } from "react";
import BoilerQuote from "./_components/BoilerQuote";

const CustomerDetailsPage = () => {
  return (
    <Suspense fallback={null}>
      <BoilerQuote />
    </Suspense>
  );
};

export default CustomerDetailsPage;
