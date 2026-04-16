// "use client";

// import { useEffect, useMemo, useState, type ChangeEvent } from "react";
// import dynamic from "next/dynamic";
// import Image from "next/image";
// import {
//   Dialog,
//   DialogContent,
//   DialogOverlay,
//   DialogPortal,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { X, Upload, Plus, Pencil } from "lucide-react";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useSession } from "next-auth/react";
// import { toast } from "sonner";

// const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// const quillModules = {
//   toolbar: [
//     ["bold", "italic", "underline"],
//     [{ list: "ordered" }, { list: "bullet" }],
//     [{ indent: "-1" }, { indent: "+1" }],
//     [{ align: [] }],
//     ["clean"],
//   ],
// };

// const quillFormats = [
//   "bold",
//   "italic",
//   "underline",
//   "list",
//   "bullet",
//   "indent",
//   "align",
// ];

// const DEFAULT_BADGES = [
//   "OUR BEST SELLER",
//   "Quiet Mark",
//   "Latest Model",
//   "Popular Model",
//   "0% finance",
// ];

// interface AddNewBoilerModalProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
// }

// export function AddNewBoilerModal({
//   open,
//   onOpenChange,
// }: AddNewBoilerModalProps) {
//   const [badges, setBadges] = useState<string[]>(DEFAULT_BADGES);
//   const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
//   const [showAddBadgeInput, setShowAddBadgeInput] = useState(false);
//   const [newBadge, setNewBadge] = useState("");
//   const [isEditingBadges, setIsEditingBadges] = useState(false);
//   const [isEditingFeatures, setIsEditingFeatures] = useState(false);
//   const [isEditingIncluded, setIsEditingIncluded] = useState(false);
//   const [isEditingSteps, setIsEditingSteps] = useState(false);

//   const [title, setTitle] = useState("");
//   const [shortDescription, setShortDescription] = useState("");
//   const [description, setDescription] = useState("");
//   const [price, setPrice] = useState("");
//   const [discountPrice, setDiscountPrice] = useState("");
//   const [payablePrice, setPayablePrice] = useState("");
//   const [monthlyPrice, setMonthlyPrice] = useState("");
//   const [boilerAbility, setBoilerAbility] = useState("");
//   const [featureTitle, setFeatureTitle] = useState("");
//   const [featureDescription, setFeatureDescription] = useState("");

//   const [features, setFeatures] = useState([{ title: "", details: "" }]);
//   const [included, setIncluded] = useState([""]);
//   const [steps, setSteps] = useState([""]);
//   const [files, setFiles] = useState<File[]>([]);
//   const [productLogo, setProductLogo] = useState<File | null>(null);
//   const [anotherLogo, setAnotherLogo] = useState<File | null>(null);
//   const [featureImage, setFeatureImage] = useState<File | null>(null);
//   const [troubleImages, setTroubleImages] = useState<File[]>([]);
//   const [stepGuideImages, setStepGuideImages] = useState<File[]>([]);
//   const queryClient = useQueryClient();
//   const { data: session } = useSession();
//   const token = session?.accessToken;

//   const handleAddBadge = () => {
//     const trimmed = newBadge.trim();
//     if (!trimmed) return;
//     setBadges((prev) => [...prev, trimmed]);
//     setSelectedBadges((prev) =>
//       prev.includes(trimmed) ? prev : [...prev, trimmed]
//     );
//     setNewBadge("");
//     setShowAddBadgeInput(false);
//   };

//   const handleRemoveBadge = (badge: string) => {
//     setBadges((prev) => prev.filter((item) => item !== badge));
//     setSelectedBadges((prev) => prev.filter((item) => item !== badge));
//   };

//   const handleToggleBadge = (badge: string) => {
//     setSelectedBadges((prev) =>
//       prev.includes(badge)
//         ? prev.filter((item) => item !== badge)
//         : [...prev, badge]
//     );
//   };

//   const handleRemoveFeature = (index: number) => {
//     setFeatures((prev) => {
//       const next = prev.filter((_, idx) => idx !== index);
//       return next.length > 0 ? next : [{ title: "", details: "" }];
//     });
//   };

//   const handleRemoveIncluded = (index: number) => {
//     setIncluded((prev) => {
//       const next = prev.filter((_, idx) => idx !== index);
//       return next.length > 0 ? next : [""];
//     });
//   };

//   const handleRemoveStep = (index: number) => {
//     setSteps((prev) => {
//       const next = prev.filter((_, idx) => idx !== index);
//       return next.length > 0 ? next : [""];
//     });
//   };

//   const handleReset = () => {
//     setBadges(DEFAULT_BADGES);
//     setSelectedBadges([]);
//     setShowAddBadgeInput(false);
//     setNewBadge("");
//     setIsEditingBadges(false);
//     setIsEditingFeatures(false);
//     setIsEditingIncluded(false);
//     setIsEditingSteps(false);
//     setTitle("");
//     setShortDescription("");
//     setDescription("");
//     setPrice("");
//     setDiscountPrice("");
//     setPayablePrice("");
//     setMonthlyPrice("");
//     setBoilerAbility("");
//     setFeatureTitle("");
//     setFeatureDescription("");
//     setFeatures([{ title: "", details: "" }]);
//     setIncluded([""]);
//     setSteps([""]);
//     setFiles([]);
//     setProductLogo(null);
//     setAnotherLogo(null);
//     setFeatureImage(null);
//     setTroubleImages([]);
//     setStepGuideImages([]);
//   };

//   useEffect(() => {
//     if (!open) {
//       handleReset();
//     }
//   }, [open]);

//   const createProductMutation = useMutation({
//     mutationFn: async () => {
//       if (!token) {
//         throw new Error("Missing access token.");
//       }

//       const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
//       const priceValue = Number(price) || 0;
//       const discountValue = Number(discountPrice) || 0;
//       const payableValue =
//         Number(payablePrice) ||
//         (discountValue > 0 ? discountValue : priceValue);
//       const monthlyValue = Number(monthlyPrice) || 0;

//       const boilerFeatures = features
//         .map((feature) => ({
//           title: feature.title.trim(),
//           value: feature.details.trim(),
//         }))
//         .filter((feature) => feature.title || feature.value);

//       const boilerInstallationGuide = steps
//         .map((step) => step.trim())
//         .filter(Boolean)
//         .map((step) => ({ title: step }));

//       const payload = {
//         title: title.trim(),
//         description,
//         shortDescription: shortDescription.trim() || description,
//         badges: selectedBadges,
//         price: priceValue,
//         discountPrice: discountValue,
//         payablePrice: payableValue,
//         monthlyPrice: monthlyValue,
//         boilerAbility: boilerAbility.trim(),
//         boilerFeatures,
//         featureInformation: {
//           featureTitle: featureTitle.trim(),
//           featureDescription: featureDescription.trim(),
//         },
//         boilerIncludedData: included
//           .map((item) => item.trim())
//           .filter(Boolean)
//           .join("\n"),
//         boilerInstallationGuide,
//       };

//       const formData = new FormData();
//       formData.append("data", JSON.stringify(payload));
//       files.forEach((file) => formData.append("images", file));
//       troubleImages.forEach((file) => formData.append("includedImages", file));
//       stepGuideImages.forEach((file) =>
//         formData.append("installationGuideImages", file)
//       );

//       const featureLogos = [productLogo, anotherLogo, featureImage].filter(
//         (file): file is File => Boolean(file)
//       );
//       featureLogos.forEach((file) => formData.append("featureLogo", file));

//       const response = await fetch(`${apiBase}/products`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         body: formData,
//       });

//       const data = await response.json().catch(() => null);
//       const hasExplicitFailure =
//         data?.success === false || data?.status === false;

//       if (!response.ok || hasExplicitFailure) {
//         throw new Error(data?.message ?? "Failed to create product.");
//       }

//       return data;
//     },
//     onSuccess: () => {
//       toast.success("Product created successfully.");
//       queryClient.invalidateQueries({ queryKey: ["products", token] });
//       onOpenChange(false);
//       handleReset();
//     },
//     onError: (error) => {
//       toast.error(
//         error instanceof Error ? error.message : "Failed to create product."
//       );
//     },
//   });

//   const handleSubmit = () => {
//     if (!title.trim()) {
//       toast.error("Title is required.");
//       return;
//     }
//     createProductMutation.mutate();
//   };

//   const handleClose = () => {
//     if (!createProductMutation.isPending) {
//       onOpenChange(false);
//     }
//   };

//   const previewUrls = useMemo(
//     () => files.map((file) => URL.createObjectURL(file)),
//     [files]
//   );
//   const productLogoUrl = useMemo(
//     () => (productLogo ? URL.createObjectURL(productLogo) : ""),
//     [productLogo]
//   );
//   const anotherLogoUrl = useMemo(
//     () => (anotherLogo ? URL.createObjectURL(anotherLogo) : ""),
//     [anotherLogo]
//   );
//   const featureImageUrl = useMemo(
//     () => (featureImage ? URL.createObjectURL(featureImage) : ""),
//     [featureImage]
//   );
//   const troubleImageUrls = useMemo(
//     () => troubleImages.map((file) => URL.createObjectURL(file)),
//     [troubleImages]
//   );
//   const stepGuideImageUrls = useMemo(
//     () => stepGuideImages.map((file) => URL.createObjectURL(file)),
//     [stepGuideImages]
//   );

//   useEffect(() => {
//     return () => {
//       previewUrls.forEach((url) => URL.revokeObjectURL(url));
//     };
//   }, [previewUrls]);

//   useEffect(() => {
//     return () => {
//       if (productLogoUrl) URL.revokeObjectURL(productLogoUrl);
//       if (anotherLogoUrl) URL.revokeObjectURL(anotherLogoUrl);
//       if (featureImageUrl) URL.revokeObjectURL(featureImageUrl);
//     };
//   }, [productLogoUrl, anotherLogoUrl, featureImageUrl]);

//   useEffect(() => {
//     return () => {
//       troubleImageUrls.forEach((url) => URL.revokeObjectURL(url));
//     };
//   }, [troubleImageUrls]);

//   useEffect(() => {
//     return () => {
//       stepGuideImageUrls.forEach((url) => URL.revokeObjectURL(url));
//     };
//   }, [stepGuideImageUrls]);

//   const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
//     const nextFiles = Array.from(event.target.files ?? []);
//     if (nextFiles.length === 0) return;
//     setFiles((prev) => [...prev, ...nextFiles]);
//     event.target.value = "";
//   };

//   const handleSingleFileChange =
//     (setter: (file: File | null) => void) =>
//     (event: ChangeEvent<HTMLInputElement>) => {
//       const file = event.target.files?.[0];
//       if (!file) return;
//       setter(file);
//       event.target.value = "";
//     };

//   const handleMultiFileChange =
//     (setter: (value: File[] | ((prev: File[]) => File[])) => void) =>
//     (event: ChangeEvent<HTMLInputElement>) => {
//       const nextFiles = Array.from(event.target.files ?? []);
//       if (nextFiles.length === 0) return;
//       setter((prev) => [...prev, ...nextFiles]);
//       event.target.value = "";
//     };

//   const handleRemoveTroubleImage = (index: number) => {
//     setTroubleImages((prev) => prev.filter((_, idx) => idx !== index));
//   };

//   const handleRemoveStepGuideImage = (index: number) => {
//     setStepGuideImages((prev) => prev.filter((_, idx) => idx !== index));
//   };

//   const handleRemoveImage = (index: number) => {
//     setFiles((prev) => prev.filter((_, idx) => idx !== index));
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogPortal>
//         <DialogOverlay className="bg-[#2D3D4DCC]" />

//         <DialogContent className="!w-[1320px] max-w-[96vw] sm:max-w-[96vw] gap-0 overflow-hidden rounded-[12px] border-none bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
//           <div className="border-b border-[#EEF2F5] px-6 py-4">
//             <div className="flex items-center justify-between">
//               <DialogTitle className="text-[16px] font-bold text-[#2D3D4D]">
//                 Add New Boiler
//               </DialogTitle>

          
//             </div>
//           </div>

//           <div className="max-h-[calc(94vh-82px)] overflow-y-auto px-5 py-5 sm:px-6">
//             <div className="space-y-5">
//               <div>
//                 <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                   Boiler Title
//                 </label>
//                 <Input
//                   value={title}
//                   onChange={(event) => setTitle(event.target.value)}
//                   placeholder="Type your title..."
//                   className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
//                 />
//               </div>

//               <div>
//                 <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                   Boiler Description
//                 </label>
//                 <div className="quill-editor overflow-hidden rounded-[8px] border border-[#D9E0E7] bg-white shadow-sm">
//                   <ReactQuill
//                     theme="snow"
//                     value={description}
//                     onChange={setDescription}
//                     placeholder="Type boiler description..."
//                     modules={quillModules}
//                     formats={quillFormats}
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                   Short Description
//                 </label>
//                 <Input
//                   value={shortDescription}
//                   onChange={(event) => setShortDescription(event.target.value)}
//                   placeholder="Type short description..."
//                   className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
//                 />
//               </div>

//               <div>
//                 <div className="mb-2 flex items-center justify-between">
//                   <label className="block text-[16px] font-medium text-[#2D3D4D]">
//                     Add Badges
//                   </label>

//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() =>
//                       setShowAddBadgeInput((prev) => !prev)
//                     }
//                     className="h-[30px] border border-[#F5D64E] bg-transparent px-4 text-[16px] text-[#F5C842] hover:bg-transparent"
//                   >
//                     {showAddBadgeInput ? "Cancel" : "Add new badge"}
//                   </Button>
//                 </div>

//                 {showAddBadgeInput && (
//                   <div className="mb-3 flex flex-wrap items-center gap-2">
//                     <Input
//                       value={newBadge}
//                       onChange={(event) => setNewBadge(event.target.value)}
//                       placeholder="Type badge name..."
//                       className="h-[34px] max-w-[260px] rounded-[8px] border-0 bg-[#F4F7F9] px-3 text-[16px] text-[#2D3D4D] placeholder:text-[#9CA3AF]"
//                     />
//                     <Button
//                       type="button"
//                       onClick={handleAddBadge}
//                       className="h-[34px] rounded-[8px] bg-[#00A56F] px-4 text-[16px] font-semibold text-white hover:bg-[#009562]"
//                     >
//                       Add
//                     </Button>
//                   </div>
//                 )}

//                 <div className="flex flex-wrap items-center gap-4">
//                   {badges.map((badge, index) => (
//                     <div
//                       key={`${badge}-${index}`}
//                       className="flex items-center gap-2 text-[16px] text-[#2D3D4D]"
//                     >
//                       {isEditingBadges ? (
//                         <>
//                           <Input
//                             value={badge}
//                             onChange={(event) => {
//                               const nextValue = event.target.value;
//                               setBadges((prev) => {
//                                 const next = [...prev];
//                                 next[index] = nextValue;
//                                 return next;
//                               });
//                               setSelectedBadges((prev) =>
//                                 prev.map((item) =>
//                                   item === badge ? nextValue : item
//                                 )
//                               );
//                             }}
//                             className="h-[32px] w-[200px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
//                           />
//                           <button
//                             type="button"
//                             onClick={() => handleRemoveBadge(badge)}
//                             className="text-[#94A3B8] hover:text-[#2D3D4D]"
//                           >
//                             <X className="h-4 w-4" />
//                           </button>
//                         </>
//                       ) : (
//                         <>
//                           <input
//                             type="checkbox"
//                             checked={selectedBadges.includes(badge)}
//                             onChange={() => handleToggleBadge(badge)}
//                             className="h-3.5 w-3.5"
//                           />
//                           <span>{badge}</span>
//                         </>
//                       )}
//                     </div>
//                   ))}

//                   <Button
//                     type="button"
//                     onClick={() => setIsEditingBadges((prev) => !prev)}
//                     className="h-[28px] bg-[#F5D64E] px-4 text-[16px] text-[#2D3D4D] hover:bg-[#edcf47]"
//                   >
//                     <Pencil className="mr-1.5 h-3.5 w-3.5" />
//                     {isEditingBadges ? "Done" : "Edit"}
//                   </Button>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                     Boiler Price
//                   </label>
//                   <Input
//                     value={price}
//                     onChange={(event) => setPrice(event.target.value)}
//                     placeholder="Type boiler price..."
//                     className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                     Boiler Discount Price Info
//                   </label>
//                   <Input
//                     value={discountPrice}
//                     onChange={(event) => setDiscountPrice(event.target.value)}
//                     placeholder="Type your discount price..."
//                     className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                     Payable Price
//                   </label>
//                   <Input
//                     value={payablePrice}
//                     onChange={(event) => setPayablePrice(event.target.value)}
//                     placeholder="Type payable price..."
//                     className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
//                   />
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                     Monthly Price
//                   </label>
//                   <Input
//                     value={monthlyPrice}
//                     onChange={(event) => setMonthlyPrice(event.target.value)}
//                     placeholder="Type monthly price..."
//                     className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                   Boiler Ability
//                 </label>
//                 <Input
//                   value={boilerAbility}
//                   onChange={(event) => setBoilerAbility(event.target.value)}
//                   placeholder="Type boiler ability..."
//                   className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
//                 />
//               </div>

//               <div>
//                 <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                   Upload boiler image
//                 </label>
//                 <div className="flex flex-wrap items-center gap-3">
//                   {previewUrls.map((url, index) => (
//                     <div
//                       key={url}
//                       className="relative h-[52px] w-[52px] overflow-hidden rounded-[6px] bg-[#E5E7EB]"
//                     >
//                       <Image
//                         src={url}
//                         alt=""
//                         fill
//                         sizes="52px"
//                         className="object-cover"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveImage(index)}
//                         className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-[#2D3D4D] shadow"
//                       >
//                         <X className="h-3.5 w-3.5" />
//                       </button>
//                     </div>
//                   ))}
//                 </div>

//                 <label
//                   htmlFor="boiler-image-upload"
//                   className="mt-3 flex h-[56px] cursor-pointer items-center justify-center rounded-[4px] bg-[#F4F7F9] text-[#64748B]"
//                 >
//                   <div className="flex flex-col items-center text-[16px]">
//                     <Upload className="mb-1 h-4 w-4" />
//                     Upload image
//                   </div>
//                 </label>
//                 <input
//                   id="boiler-image-upload"
//                   type="file"
//                   accept="image/*"
//                   multiple
//                   onChange={handleFilesChange}
//                   className="hidden"
//                 />
//               </div>

//               <div>
//                 <div className="mb-2 flex items-center justify-between">
//                   <label className="block text-[16px] font-medium text-[#2D3D4D]">
//                     Enter Features for this boiler
//                   </label>

//                   <Button
//                     type="button"
//                     onClick={() => setIsEditingFeatures((prev) => !prev)}
//                     className="h-[28px] bg-[#F5D64E] px-4 text-[16px] text-[#2D3D4D] hover:bg-[#edcf47]"
//                   >
//                     <Pencil className="mr-1.5 h-3.5 w-3.5" />
//                     {isEditingFeatures ? "Done" : "Edit"}
//                   </Button>
//                 </div>

//                 <div className="space-y-3">
//                   {features.map((feature, index) => (
//                     <div
//                       key={index}
//                       className="flex flex-col gap-3 sm:flex-row sm:items-center"
//                     >
//                       <Input
//                         placeholder="Type your feature title..."
//                         value={feature.title}
//                         onChange={(e) => {
//                           const next = [...features];
//                           next[index].title = e.target.value;
//                           setFeatures(next);
//                         }}
//                         className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none sm:flex-1"
//                       />
//                       <Input
//                         placeholder="Type your feature title..."
//                         value={feature.details}
//                         onChange={(e) => {
//                           const next = [...features];
//                           next[index].details = e.target.value;
//                           setFeatures(next);
//                         }}
//                         className="h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none sm:flex-1"
//                       />
//                       {isEditingFeatures && (
//                         <button
//                           type="button"
//                           onClick={() => handleRemoveFeature(index)}
//                           className="self-start text-[#94A3B8] hover:text-[#2D3D4D] sm:self-auto"
//                         >
//                           <X className="h-4 w-4" />
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                   Feature Section Information
//                 </label>

//                 <Input
//                   value={featureTitle}
//                   onChange={(event) => setFeatureTitle(event.target.value)}
//                   placeholder="Type your title..."
//                   className="mb-3 h-[40px] border-0 bg-[#F4F7F9] text-[16px] shadow-none"
//                 />

//                 <textarea
//                   value={featureDescription}
//                   onChange={(event) => setFeatureDescription(event.target.value)}
//                   placeholder="Type feature description..."
//                   className="min-h-[80px] w-full rounded-[6px] border border-[#D9E0E7] bg-[#F4F7F9] px-3 py-3 text-[16px] text-[#2D3D4D] outline-none"
//                 />
//               </div>

//                 <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
//                 <div>
//                   <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                     Upload Product logo
//                   </label>
//                   <div className="flex items-center gap-3">
//                     {productLogoUrl ? (
//                       <div className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]">
//                         <Image
//                           src={productLogoUrl}
//                           alt=""
//                           fill
//                           sizes="56px"
//                           className="object-cover"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setProductLogo(null)}
//                           className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-[#2D3D4D] shadow"
//                         >
//                           <X className="h-3.5 w-3.5" />
//                         </button>
//                       </div>
//                     ) : null}
//                     <label
//                       htmlFor="product-logo-upload"
//                       className="flex h-[56px] flex-1 cursor-pointer items-center justify-center rounded-[4px] bg-[#F4F7F9] text-[#64748B]"
//                     >
//                       <div className="flex flex-col items-center text-[16px]">
//                         <Upload className="mb-1 h-4 w-4" />
//                         Upload image
//                       </div>
//                     </label>
//                     <input
//                       id="product-logo-upload"
//                       type="file"
//                       accept="image/*"
//                       onChange={handleSingleFileChange(setProductLogo)}
//                       className="hidden"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                     Upload Another logo
//                   </label>
//                   <div className="flex items-center gap-3">
//                     {anotherLogoUrl ? (
//                       <div className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]">
//                         <Image
//                           src={anotherLogoUrl}
//                           alt=""
//                           fill
//                           sizes="56px"
//                           className="object-cover"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setAnotherLogo(null)}
//                           className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-[#2D3D4D] shadow"
//                         >
//                           <X className="h-3.5 w-3.5" />
//                         </button>
//                       </div>
//                     ) : null}
//                     <label
//                       htmlFor="another-logo-upload"
//                       className="flex h-[56px] flex-1 cursor-pointer items-center justify-center rounded-[4px] bg-[#F4F7F9] text-[#64748B]"
//                     >
//                       <div className="flex flex-col items-center text-[16px]">
//                         <Upload className="mb-1 h-4 w-4" />
//                         Upload image
//                       </div>
//                     </label>
//                     <input
//                       id="another-logo-upload"
//                       type="file"
//                       accept="image/*"
//                       onChange={handleSingleFileChange(setAnotherLogo)}
//                       className="hidden"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                     Upload Boiler Feature image
//                   </label>
//                   <div className="flex items-center gap-3">
//                     {featureImageUrl ? (
//                       <div className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]">
//                         <Image
//                           src={featureImageUrl}
//                           alt=""
//                           fill
//                           sizes="56px"
//                           className="object-cover"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setFeatureImage(null)}
//                           className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-[#2D3D4D] shadow"
//                         >
//                           <X className="h-3.5 w-3.5" />
//                         </button>
//                       </div>
//                     ) : null}
//                     <label
//                       htmlFor="boiler-feature-upload"
//                       className="flex h-[56px] flex-1 cursor-pointer items-center justify-center rounded-[4px] bg-[#F4F7F9] text-[#64748B]"
//                     >
//                       <div className="flex flex-col items-center text-[16px]">
//                         <Upload className="mb-1 h-4 w-4" />
//                         Upload image
//                       </div>
//                     </label>
//                     <input
//                       id="boiler-feature-upload"
//                       type="file"
//                       accept="image/*"
//                       onChange={handleSingleFileChange(setFeatureImage)}
//                       className="hidden"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <div className="mb-2 flex items-center justify-between">
//                   <label className="block text-[16px] font-medium text-[#2D3D4D]">
//                     What&apos;s included
//                   </label>

//                   <Button
//                     type="button"
//                     onClick={() => setIsEditingIncluded((prev) => !prev)}
//                     className="h-[28px] bg-[#F5D64E] px-4 text-[16px] text-[#2D3D4D] hover:bg-[#edcf47]"
//                   >
//                     <Pencil className="mr-1.5 h-3.5 w-3.5" />
//                     {isEditingIncluded ? "Done" : "Edit"}
//                   </Button>
//                 </div>

//                 <div className="space-y-3">
//                   {included.map((item, index) => (
//                     <div key={index} className="flex items-center gap-2">
//                       <Input
//                         placeholder="Type what's include..."
//                         value={item}
//                         onChange={(e) => {
//                           const next = [...included];
//                           next[index] = e.target.value;
//                           setIncluded(next);
//                         }}
//                         className="h-[40px] flex-1 border-0 bg-[#F4F7F9] text-[16px] shadow-none"
//                       />
//                       {isEditingIncluded && (
//                         <button
//                           type="button"
//                           onClick={() => handleRemoveIncluded(index)}
//                           className="text-[#94A3B8] hover:text-[#2D3D4D]"
//                         >
//                           <X className="h-4 w-4" />
//                         </button>
//                       )}
//                     </div>
//                   ))}

//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => setIncluded((prev) => [...prev, ""])}
//                     className="h-[28px] border border-[#F5D64E] bg-transparent px-4 text-[16px] text-[#F5C842] hover:bg-transparent"
//                   >
//                     <Plus className="mr-1.5 h-3.5 w-3.5" />
//                     Add Include
//                   </Button>
//                 </div>
//               </div>

//               <div>
//                 <label className="mb-2 block text-[16px] font-medium text-[#2D3D4D]">
//                   Upload trouble image
//                 </label>
//                 <div className="flex flex-wrap items-center gap-3">
//                   {troubleImageUrls.map((url, index) => (
//                     <div
//                       key={`${url}-${index}`}
//                       className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]"
//                     >
//                       <Image
//                         src={url}
//                         alt=""
//                         fill
//                         sizes="56px"
//                         className="object-cover"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveTroubleImage(index)}
//                         className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-[#2D3D4D] shadow"
//                       >
//                         <X className="h-3.5 w-3.5" />
//                       </button>
//                     </div>
//                   ))}
//                 </div>

//                 <label
//                   htmlFor="trouble-image-upload"
//                   className="mt-3 flex h-[56px] cursor-pointer items-center justify-center rounded-[4px] bg-[#F4F7F9] text-[#64748B]"
//                 >
//                   <div className="flex flex-col items-center text-[16px]">
//                     <Upload className="mb-1 h-4 w-4" />
//                     Upload image
//                   </div>
//                 </label>
//                 <input
//                   id="trouble-image-upload"
//                   type="file"
//                   accept="image/*"
//                   multiple
//                   onChange={handleMultiFileChange(setTroubleImages)}
//                   className="hidden"
//                 />
//               </div>

//               <div>
//                 <div className="mb-2 flex items-center justify-between">
//                   <label className="block text-[16px] font-medium text-[#2D3D4D]">
//                     A Step by step guide to your installation
//                   </label>

//                   <div className="flex items-center gap-2">
//                     <Button
//                       type="button"
//                       variant="outline"
//                       onClick={() => setSteps((prev) => [...prev, ""])}
//                       className="h-[28px] border border-[#F5D64E] bg-transparent px-4 text-[16px] text-[#F5C842] hover:bg-transparent"
//                     >
//                       <Plus className="mr-1.5 h-3.5 w-3.5" />
//                       Add
//                     </Button>

//                     <Button
//                       type="button"
//                       onClick={() => setIsEditingSteps((prev) => !prev)}
//                       className="h-[28px] bg-[#F5D64E] px-4 text-[16px] text-[#2D3D4D] hover:bg-[#edcf47]"
//                     >
//                       <Pencil className="mr-1.5 h-3.5 w-3.5" />
//                       {isEditingSteps ? "Done" : "Edit"}
//                     </Button>
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   {steps.map((step, index) => (
//                     <div key={index} className="flex items-center gap-2">
//                       <Input
//                         placeholder="Type your guide title..."
//                         value={step}
//                         onChange={(e) => {
//                           const next = [...steps];
//                           next[index] = e.target.value;
//                           setSteps(next);
//                         }}
//                         className="h-[40px] flex-1 border-0 bg-[#F4F7F9] text-[16px] shadow-none"
//                       />
//                       {isEditingSteps && (
//                         <button
//                           type="button"
//                           onClick={() => handleRemoveStep(index)}
//                           className="text-[#94A3B8] hover:text-[#2D3D4D]"
//                         >
//                           <X className="h-4 w-4" />
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                 </div>

//                 <div className="mt-3 flex flex-wrap items-center gap-3">
//                   {stepGuideImageUrls.map((url, index) => (
//                     <div
//                       key={`${url}-${index}`}
//                       className="relative h-[56px] w-[56px] overflow-hidden rounded-[6px] bg-[#E5E7EB]"
//                     >
//                       <Image
//                         src={url}
//                         alt=""
//                         fill
//                         sizes="56px"
//                         className="object-cover"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveStepGuideImage(index)}
//                         className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-[#2D3D4D] shadow"
//                       >
//                         <X className="h-3.5 w-3.5" />
//                       </button>
//                     </div>
//                   ))}
//                 </div>

//                 <label
//                   htmlFor="step-guide-upload"
//                   className="mt-3 flex h-[56px] cursor-pointer items-center justify-center rounded-[4px] bg-[#F4F7F9] text-[#64748B]"
//                 >
//                   <div className="flex flex-col items-center text-[16px]">
//                     <Upload className="mb-1 h-4 w-4" />
//                     Upload image
//                   </div>
//                 </label>
//                 <input
//                   id="step-guide-upload"
//                   type="file"
//                   accept="image/*"
//                   multiple
//                   onChange={handleMultiFileChange(setStepGuideImages)}
//                   className="hidden"
//                 />
//               </div>

//               <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={handleClose}
//                   disabled={createProductMutation.isPending}
//                   className="h-[46px] border border-[#F5D64E] bg-transparent text-[16px] text-[#F5C842] hover:bg-transparent"
//                 >
//                   Not now
//                 </Button>

//                 <Button
//                   type="button"
//                   onClick={handleSubmit}
//                   disabled={createProductMutation.isPending}
//                   className="h-[46px] bg-[#F5D64E] text-[16px] text-[#2D3D4D] hover:bg-[#edcf47] disabled:cursor-not-allowed disabled:opacity-70"
//                 >
//                   {createProductMutation.isPending ? "Saving..." : "Add"}
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </DialogContent>
//       </DialogPortal>
//     </Dialog>
//   );
// }




"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Plus, SquarePen } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const quillModules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["clean"],
  ],
};

const quillFormats = [
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "indent",
  "align",
];

const DEFAULT_BADGES = [
  "OUR BEST SELLER",
  "Quiet Mark",
  "Latest Model",
  "Popular Model",
  "0% finance",
];

interface AddNewBoilerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const resolveAccessToken = (sessionData: unknown): string | undefined => {
  if (!sessionData || typeof sessionData !== "object") return undefined;

  const sessionObject = sessionData as Record<string, unknown>;
  if (typeof sessionObject.accessToken === "string" && sessionObject.accessToken) {
    return sessionObject.accessToken;
  }

  const user = sessionObject.user;
  if (!user || typeof user !== "object") return undefined;

  const userObject = user as Record<string, unknown>;
  if (typeof userObject.accessToken === "string" && userObject.accessToken) {
    return userObject.accessToken;
  }

  return undefined;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[18px] sm:text-[20px] font-bold leading-none text-[#2D3D4D]">
      {children}
    </h3>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[13px] sm:text-[14px] font-medium text-[#2D3D4D]">
      {children}
    </label>
  );
}

function UploadBox({
  id,
  multiple = false,
  onChange,
  label = "Upload image",
}: {
  id: string;
  multiple?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
}) {
  return (
    <>
      <label
        htmlFor={id}
        className="flex h-[86px] sm:h-[92px] w-full cursor-pointer items-center justify-center rounded-[8px] bg-[#F4F7F9] text-[#7B8794] transition hover:bg-[#eef2f5]"
      >
        <div className="flex flex-col items-center text-[12px] sm:text-[13px]">
          <Upload className="mb-2 h-4 w-4" />
          {label}
        </div>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={onChange}
        className="hidden"
      />
    </>
  );
}

function PreviewThumb({
  src,
  onRemove,
}: {
  src: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative h-[44px] w-[44px] overflow-hidden rounded-[4px] bg-[#D9D9D9] sm:h-[52px] sm:w-[52px]">
      <Image src={src} alt="" fill sizes="52px" className="object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#2D3D4D] shadow"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function AddNewBoilerModal({
  open,
  onOpenChange,
}: AddNewBoilerModalProps) {
  const [badges, setBadges] = useState<string[]>(DEFAULT_BADGES);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [showAddBadgeInput, setShowAddBadgeInput] = useState(false);
  const [newBadge, setNewBadge] = useState("");
  const [isEditingBadges, setIsEditingBadges] = useState(false);
  const [isEditingFeatures, setIsEditingFeatures] = useState(false);
  const [isEditingIncluded, setIsEditingIncluded] = useState(false);
  const [isEditingAlsoUse, setIsEditingAlsoUse] = useState(false);
  const [isEditingSteps, setIsEditingSteps] = useState(false);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [payablePrice, setPayablePrice] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [boilerAbility, setBoilerAbility] = useState("");
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");

  const [features, setFeatures] = useState([{ title: "", details: "" }]);
  const [included, setIncluded] = useState([""]);
  const [alsoUse, setAlsoUse] = useState([""]);
  const [steps, setSteps] = useState([""]);
  const [files, setFiles] = useState<File[]>([]);
  const [productLogo, setProductLogo] = useState<File | null>(null);
  const [anotherLogo, setAnotherLogo] = useState<File | null>(null);
  const [featureImage, setFeatureImage] = useState<File | null>(null);
  const [includeImages, setIncludeImages] = useState<File[]>([]);
  const [stepGuideImages, setStepGuideImages] = useState<File[]>([]);

  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = resolveAccessToken(session);

  const handleAddBadge = () => {
    const trimmed = newBadge.trim();
    if (!trimmed) return;

    setBadges((prev) => [...prev, trimmed]);
    setSelectedBadges((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    );
    setNewBadge("");
    setShowAddBadgeInput(false);
  };

  const handleRemoveBadge = (badge: string) => {
    setBadges((prev) => prev.filter((item) => item !== badge));
    setSelectedBadges((prev) => prev.filter((item) => item !== badge));
  };

  const handleToggleBadge = (badge: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badge)
        ? prev.filter((item) => item !== badge)
        : [...prev, badge]
    );
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [{ title: "", details: "" }];
    });
  };

  const handleRemoveIncluded = (index: number) => {
    setIncluded((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const handleRemoveAlsoUse = (index: number) => {
    setAlsoUse((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const handleReset = () => {
    setBadges(DEFAULT_BADGES);
    setSelectedBadges([]);
    setShowAddBadgeInput(false);
    setNewBadge("");
    setIsEditingBadges(false);
    setIsEditingFeatures(false);
    setIsEditingIncluded(false);
    setIsEditingAlsoUse(false);
    setIsEditingSteps(false);
    setTitle("");
    setShortDescription("");
    setDescription("");
    setPrice("");
    setDiscountPrice("");
    setPayablePrice("");
    setMonthlyPrice("");
    setBoilerAbility("");
    setFeatureTitle("");
    setFeatureDescription("");
    setFeatures([{ title: "", details: "" }]);
    setIncluded([""]);
    setAlsoUse([""]);
    setSteps([""]);
    setFiles([]);
    setProductLogo(null);
    setAnotherLogo(null);
    setFeatureImage(null);
    setIncludeImages([]);
    setStepGuideImages([]);
  };

  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open]);

  const createProductMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Missing access token.");
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const priceValue = Number(price) || 0;
      const discountValue = Number(discountPrice) || 0;
      const payableValue =
        Number(payablePrice) || (discountValue > 0 ? discountValue : priceValue);
      const monthlyValue = Number(monthlyPrice) || 0;

      const boilerFeatures = features
        .map((feature) => ({
          title: feature.title.trim(),
          value: feature.details.trim(),
        }))
        .filter((feature) => feature.title || feature.value);

      const boilerInstallationGuide = steps
        .map((step) => step.trim())
        .filter(Boolean)
        .map((step) => ({ title: step }));

      const payload = {
        title: title.trim(),
        description,
        shortDescription: shortDescription.trim() || description,
        badges: selectedBadges,
        price: priceValue,
        discountPrice: discountValue,
        payablePrice: payableValue,
        monthlyPrice: monthlyValue,
        boilerAbility: boilerAbility.trim(),
        boilerFeatures,
        featureInformation: {
          featureTitle: featureTitle.trim(),
          featureDescription: featureDescription.trim(),
        },
        boilerIncludedData: included.map((item) => item.trim()).filter(Boolean).join("\n"),
        alsoUseData: alsoUse.map((item) => item.trim()).filter(Boolean).join("\n"),
        boilerInstallationGuide,
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      files.forEach((file) => formData.append("images", file));
      includeImages.forEach((file) => formData.append("includedImages", file));
      stepGuideImages.forEach((file) =>
        formData.append("installationGuideImages", file)
      );

      const featureLogos = [productLogo, anotherLogo, featureImage].filter(
        (file): file is File => Boolean(file)
      );
      featureLogos.forEach((file) => formData.append("featureLogo", file));

      const response = await fetch(`${apiBase}/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);
      const hasExplicitFailure = data?.success === false || data?.status === false;

      if (!response.ok || hasExplicitFailure) {
        throw new Error(data?.message ?? "Failed to create product.");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Product created successfully.");
      queryClient.invalidateQueries({ queryKey: ["products", token] });
      onOpenChange(false);
      handleReset();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create product."
      );
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    createProductMutation.mutate();
  };

  const handleClose = () => {
    if (!createProductMutation.isPending) {
      onOpenChange(false);
    }
  };

  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );
  const productLogoUrl = useMemo(
    () => (productLogo ? URL.createObjectURL(productLogo) : ""),
    [productLogo]
  );
  const anotherLogoUrl = useMemo(
    () => (anotherLogo ? URL.createObjectURL(anotherLogo) : ""),
    [anotherLogo]
  );
  const featureImageUrl = useMemo(
    () => (featureImage ? URL.createObjectURL(featureImage) : ""),
    [featureImage]
  );
  const includeImageUrls = useMemo(
    () => includeImages.map((file) => URL.createObjectURL(file)),
    [includeImages]
  );
  const stepGuideImageUrls = useMemo(
    () => stepGuideImages.map((file) => URL.createObjectURL(file)),
    [stepGuideImages]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      if (productLogoUrl) URL.revokeObjectURL(productLogoUrl);
      if (anotherLogoUrl) URL.revokeObjectURL(anotherLogoUrl);
      if (featureImageUrl) URL.revokeObjectURL(featureImageUrl);
    };
  }, [productLogoUrl, anotherLogoUrl, featureImageUrl]);

  useEffect(() => {
    return () => {
      includeImageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [includeImageUrls]);

  useEffect(() => {
    return () => {
      stepGuideImageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [stepGuideImageUrls]);

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    if (nextFiles.length === 0) return;
    setFiles((prev) => [...prev, ...nextFiles]);
    event.target.value = "";
  };

  const handleSingleFileChange =
    (setter: (file: File | null) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setter(file);
      event.target.value = "";
    };

  const handleMultiFileChange =
    (setter: (value: File[] | ((prev: File[]) => File[])) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFiles = Array.from(event.target.files ?? []);
      if (nextFiles.length === 0) return;
      setter((prev) => [...prev, ...nextFiles]);
      event.target.value = "";
    };

  const handleRemoveIncludeImage = (index: number) => {
    setIncludeImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveStepGuideImage = (index: number) => {
    setStepGuideImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveImage = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-[#2D3D4DCC]" />

        <DialogContent className="!w-[1320px] max-w-[96vw] sm:max-w-[96vw] gap-0 overflow-hidden rounded-[12px] border-none bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
          {/* Header */}
          <div className="border-b border-[#EEF2F5] px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-[26px] sm:text-[30px] font-bold text-[#2D3D4D]">
                Add New Boiler
              </DialogTitle>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[calc(95vh-96px)] overflow-y-auto px-5 py-5 sm:px-6">
            <div className="space-y-6">
              {/* Boiler Title */}
              <div>
                <FieldLabel>Boiler Title</FieldLabel>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Type your title..."
                  className="h-[44px] rounded-[10px] border-0 bg-[#F4F7F9] px-4 text-[14px] text-[#2D3D4D] shadow-none placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
                />
              </div>

              <div>
                <FieldLabel>Boiler Ability</FieldLabel>
                <Input
                  value={boilerAbility}
                  onChange={(event) => setBoilerAbility(event.target.value)}
                  placeholder="Type boiler ability..."
                  className="h-[44px] rounded-[10px] border-0 bg-[#F4F7F9] px-4 text-[14px] text-[#2D3D4D] shadow-none placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#d9dee6]"
                />
              </div>

              {/* Boiler Description */}
              <div>
                <FieldLabel>Boiler Description</FieldLabel>
                <div className="quill-editor boiler-quill-editor overflow-hidden rounded-[10px] border border-[#D9E0E7] bg-white shadow-sm">
                  <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    placeholder="Type boiler description..."
                    modules={quillModules}
                    formats={quillFormats}
                  />
                </div>
              </div>

              {/* Add Badges */}
              <div>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionTitle>Add Badges</SectionTitle>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddBadgeInput((prev) => !prev)}
                      className="h-[36px] rounded-[8px] border border-[#F5D64E] bg-transparent px-4 text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                    >
                      Add more badge
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setIsEditingBadges((prev) => !prev)}
                      className="h-[36px] rounded-[8px] bg-[#F5D64E] px-4 text-[14px] font-medium text-[#2D3D4D] hover:bg-[#edcf47]"
                    >
                      <SquarePen className="mr-2 h-4 w-4" />
                      {isEditingBadges ? "Done" : "Edit"}
                    </Button>
                  </div>
                </div>

                {showAddBadgeInput && (
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={newBadge}
                      onChange={(event) => setNewBadge(event.target.value)}
                      placeholder="Type badge name..."
                      className="h-[40px] max-w-[280px] rounded-[10px] border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                    />
                    <Button
                      type="button"
                      onClick={handleAddBadge}
                      className="h-[40px] rounded-[8px] bg-[#00A56F] px-4 text-[14px] text-white hover:bg-[#009562]"
                    >
                      Add
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {badges.map((badge, index) => (
                    <div
                      key={`${badge}-${index}`}
                      className="flex items-center gap-2 rounded-full bg-[#F4F7F9] px-3 py-2 text-[14px] font-medium text-[#2D3D4D]"
                    >
                      {isEditingBadges ? (
                        <>
                          <Input
                            value={badge}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setBadges((prev) => {
                                const next = [...prev];
                                next[index] = nextValue;
                                return next;
                              });
                              setSelectedBadges((prev) =>
                                prev.map((item) => (item === badge ? nextValue : item))
                              );
                            }}
                            className="h-[28px] w-[160px] border-0 bg-transparent p-0 text-[14px] shadow-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBadge(badge)}
                            className="text-[#94A3B8] hover:text-[#2D3D4D]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            checked={selectedBadges.includes(badge)}
                            onChange={() => handleToggleBadge(badge)}
                            className="h-4 w-4 rounded border-[#CBD5E1]"
                          />
                          <span>{badge}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <FieldLabel>Boiler Price</FieldLabel>
                <Input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="Type boiler price..."
                  className="h-[44px] rounded-[10px] border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                />
              </div>

              {/* Discount */}
              <div>
                <FieldLabel>Enter Discount in this boiler</FieldLabel>
                <Input
                  value={discountPrice}
                  onChange={(event) => setDiscountPrice(event.target.value)}
                  placeholder="Type your discount price..."
                  className="h-[44px] rounded-[10px] border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                />
              </div>

              {/* Upload Boiler Images */}
              <div>
                <FieldLabel>Upload boiler images</FieldLabel>

                <div className="mb-3 flex flex-wrap gap-3">
                  {previewUrls.map((url, index) => (
                    <PreviewThumb
                      key={url}
                      src={url}
                      onRemove={() => handleRemoveImage(index)}
                    />
                  ))}
                </div>

                <UploadBox
                  id="boiler-image-upload"
                  multiple
                  onChange={handleFilesChange}
                />
              </div>

              {/* Enter Features */}
              <div>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionTitle>Enter Features for this boiler</SectionTitle>

                  <Button
                    type="button"
                    onClick={() => setIsEditingFeatures((prev) => !prev)}
                    className="h-[36px] rounded-[8px] bg-[#F5D64E] px-4 text-[14px] font-medium text-[#2D3D4D] hover:bg-[#edcf47]"
                  >
                    <SquarePen className="mr-2 h-4 w-4" />
                    {isEditingFeatures ? "Done" : "Edit"}
                  </Button>
                </div>

                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <FieldLabel>Feature title</FieldLabel>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Type your feature title..."
                            value={feature.title}
                            onChange={(e) => {
                              const next = [...features];
                              next[index].title = e.target.value;
                              setFeatures(next);
                            }}
                            className="h-[42px] border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                          />
                          {isEditingFeatures && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(index)}
                              className="text-[#94A3B8] hover:text-[#2D3D4D]"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <FieldLabel>Feature Details</FieldLabel>
                        <Input
                          placeholder="Type your feature title..."
                          value={feature.details}
                          onChange={(e) => {
                            const next = [...features];
                            next[index].details = e.target.value;
                            setFeatures(next);
                          }}
                          className="h-[42px] border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFeatures((prev) => [...prev, { title: "", details: "" }])
                  }
                  className="mt-3 h-[36px] rounded-[8px] border border-[#F5D64E] bg-transparent px-4 text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add more Features
                </Button>
              </div>

              {/* Feature Section information */}
              <div>
                <SectionTitle>Feature Section information</SectionTitle>

                <div className="mt-4 space-y-4">
                  <div>
                    <FieldLabel>Feature Title</FieldLabel>
                    <Input
                      value={featureTitle}
                      onChange={(event) => setFeatureTitle(event.target.value)}
                      placeholder="Type your title..."
                      className="h-[44px] rounded-[10px] border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                    />
                  </div>

                  <div>
                    <FieldLabel>Feature Description</FieldLabel>
                    <div className="quill-editor boiler-quill-editor overflow-hidden rounded-[10px] border border-[#D9E0E7] bg-white shadow-sm">
                      <ReactQuill
                        theme="snow"
                        value={featureDescription}
                        onChange={setFeatureDescription}
                        placeholder="Type Feature description..."
                        modules={quillModules}
                        formats={quillFormats}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload 3 logos */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <FieldLabel>Upload Product logo</FieldLabel>
                  <div className="mb-3">
                    {productLogoUrl ? (
                      <PreviewThumb
                        src={productLogoUrl}
                        onRemove={() => setProductLogo(null)}
                      />
                    ) : null}
                  </div>
                  <UploadBox
                    id="product-logo-upload"
                    onChange={handleSingleFileChange(setProductLogo)}
                  />
                </div>

                <div>
                  <FieldLabel>Upload Another logo</FieldLabel>
                  <div className="mb-3">
                    {anotherLogoUrl ? (
                      <PreviewThumb
                        src={anotherLogoUrl}
                        onRemove={() => setAnotherLogo(null)}
                      />
                    ) : null}
                  </div>
                  <UploadBox
                    id="another-logo-upload"
                    onChange={handleSingleFileChange(setAnotherLogo)}
                  />
                </div>

                <div>
                  <FieldLabel>Upload Boiler Feature image</FieldLabel>
                  <div className="mb-3">
                    {featureImageUrl ? (
                      <PreviewThumb
                        src={featureImageUrl}
                        onRemove={() => setFeatureImage(null)}
                      />
                    ) : null}
                  </div>
                  <UploadBox
                    id="boiler-feature-upload"
                    onChange={handleSingleFileChange(setFeatureImage)}
                  />
                </div>
              </div>

              {/* What's included */}
              <div>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionTitle>What’s included</SectionTitle>

                  <Button
                    type="button"
                    onClick={() => setIsEditingIncluded((prev) => !prev)}
                    className="h-[36px] rounded-[8px] bg-[#F5D64E] px-4 text-[14px] font-medium text-[#2D3D4D] hover:bg-[#edcf47]"
                  >
                    <SquarePen className="mr-2 h-4 w-4" />
                    {isEditingIncluded ? "Done" : "Edit"}
                  </Button>
                </div>

                <FieldLabel>Include</FieldLabel>
                <div className="space-y-3">
                  {included.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Type what’s include..."
                        value={item}
                        onChange={(e) => {
                          const next = [...included];
                          next[index] = e.target.value;
                          setIncluded(next);
                        }}
                        className="h-[42px] flex-1 border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                      />
                      {isEditingIncluded && (
                        <button
                          type="button"
                          onClick={() => handleRemoveIncluded(index)}
                          className="text-[#94A3B8] hover:text-[#2D3D4D]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIncluded((prev) => [...prev, ""])}
                  className="mt-3 h-[36px] rounded-[8px] border border-[#F5D64E] bg-transparent px-4 text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add included
                </Button>
              </div>

              {/* Also on us */}
              <div>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <FieldLabel>Also on us.....</FieldLabel>

                  <Button
                    type="button"
                    onClick={() => setIsEditingAlsoUse((prev) => !prev)}
                    className="h-[36px] rounded-[8px] bg-[#F5D64E] px-4 text-[14px] font-medium text-[#2D3D4D] hover:bg-[#edcf47]"
                  >
                    <SquarePen className="mr-2 h-4 w-4" />
                    {isEditingAlsoUse ? "Done" : "Edit"}
                  </Button>
                </div>

                <div className="space-y-3">
                  {alsoUse.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Type what’s Also on us........"
                        value={item}
                        onChange={(e) => {
                          const next = [...alsoUse];
                          next[index] = e.target.value;
                          setAlsoUse(next);
                        }}
                        className="h-[42px] flex-1 border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                      />
                      {isEditingAlsoUse && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAlsoUse(index)}
                          className="text-[#94A3B8] hover:text-[#2D3D4D]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAlsoUse((prev) => [...prev, ""])}
                  className="mt-3 h-[36px] rounded-[8px] border border-[#F5D64E] bg-transparent px-4 text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Also on us....
                </Button>
              </div>

              {/* Upload include image */}
              <div>
                <FieldLabel>Upload Include image</FieldLabel>

                <div className="mb-3 flex flex-wrap gap-3">
                  {includeImageUrls.map((url, index) => (
                    <PreviewThumb
                      key={`${url}-${index}`}
                      src={url}
                      onRemove={() => handleRemoveIncludeImage(index)}
                    />
                  ))}
                </div>

                <UploadBox
                  id="include-image-upload"
                  multiple
                  onChange={handleMultiFileChange(setIncludeImages)}
                />
              </div>

              {/* Guide section */}
              <div>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionTitle>A Step by step guide to your installation</SectionTitle>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSteps((prev) => [...prev, ""])}
                      className="h-[36px] rounded-[8px] border border-[#F5D64E] bg-transparent px-4 text-[14px] font-medium text-[#F5C842] hover:bg-transparent"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setIsEditingSteps((prev) => !prev)}
                      className="h-[36px] rounded-[8px] bg-[#F5D64E] px-4 text-[14px] font-medium text-[#2D3D4D] hover:bg-[#edcf47]"
                    >
                      <SquarePen className="mr-2 h-4 w-4" />
                      {isEditingSteps ? "Done" : "Edit"}
                    </Button>
                  </div>
                </div>

                <FieldLabel>Guide Text</FieldLabel>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Type your guide text..."
                        value={step}
                        onChange={(e) => {
                          const next = [...steps];
                          next[index] = e.target.value;
                          setSteps(next);
                        }}
                        className="h-[42px] flex-1 border-0 bg-[#F4F7F9] text-[14px] shadow-none"
                      />
                      {isEditingSteps && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(index)}
                          className="text-[#94A3B8] hover:text-[#2D3D4D]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <FieldLabel>Upload Guide image</FieldLabel>

                  <div className="mb-3 flex flex-wrap gap-3">
                    {stepGuideImageUrls.map((url, index) => (
                      <PreviewThumb
                        key={`${url}-${index}`}
                        src={url}
                        onRemove={() => handleRemoveStepGuideImage(index)}
                      />
                    ))}
                  </div>

                  <UploadBox
                    id="step-guide-upload"
                    multiple
                    onChange={handleMultiFileChange(setStepGuideImages)}
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createProductMutation.isPending}
                  className="h-[48px] rounded-[10px] border border-[#F5D64E] bg-transparent text-[15px] font-medium text-[#F5C842] hover:bg-transparent"
                >
                  Not now
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createProductMutation.isPending}
                  className="h-[48px] rounded-[10px] bg-[#F5D64E] text-[15px] font-medium text-[#2D3D4D] hover:bg-[#edcf47] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {createProductMutation.isPending ? "Saving..." : "Add"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
