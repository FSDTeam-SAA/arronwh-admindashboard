"use client";

import {
  useCallback,
  useEffect,
  useState,
//   type ChangeEvent,
  type FormEvent,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Trash2 } from "lucide-react";

type PriceOption = {
  name: string;
  value: string;
};

type QuizPriceManagementData = {
  _id: string;
  name?: string;
  value?: PriceOption[];
};

type ApiResponse = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: QuizPriceManagementData | QuizPriceManagementData[];
};

const getEndpoint = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}/quize-price-management` : "/quize-price-management";
};

export default function QuizePriceManagementContainer() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [dataId, setDataId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [options, setOptions] = useState<PriceOption[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(
    async () => {
      setIsLoading(true);
      try {
        const response = await fetch(getEndpoint(), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const result = (await response.json().catch(() => null)) as ApiResponse;

        if (!response.ok || result?.success === false) {
          throw new Error(result?.message ?? "Failed to load data.");
        }

        const dataArr = result?.data;
        if (Array.isArray(dataArr) && dataArr.length > 0) {
          const item = dataArr[0];
          setDataId(item._id);
          setName(item.name || "");
          setOptions(Array.isArray(item.value) ? item.value : []);
        } else {
           throw new Error("No data found.");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load data."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

//   const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
//     setName(e.target.value);
//   };

  const handleOptionChange = (index: number, field: keyof PriceOption, val: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: val };
    setOptions(newOptions);
  };

//   const addOption = () => {
//     setOptions([...options, { name: "", value: "" }]);
//   };

//   const removeOption = (index: number) => {
//     const newOptions = options.filter((_, i) => i !== index);
//     setOptions(newOptions);
//   };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dataId) {
      toast.error("No data to update.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        value: options.map(opt => ({
          name: opt.name.trim(),
          value: opt.value.trim()
        }))
      };

      const response = await fetch(`${getEndpoint()}/${dataId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      
      const result = (await response.json().catch(() => null)) as ApiResponse;

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message ?? "Failed to update data.");
      }

      toast.success("Quiz price management updated successfully.");
      await fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update data."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading data...</div>;
  }

  return (
    <div className="w-full rounded-xl border bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-semibold">Edit Quiz Price Management</h2>

      {!dataId ? (
        <p className="text-sm text-gray-500">Failed to load content. Please refresh.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* <div>
            <Label className="text-lg font-normal text-[#2D3D4D]">Question Name</Label>
            <Input
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Where do you want your new boiler?"
              required
              className="mt-1.5 h-12 text-lg font-normal text-[#1E1E1E]"
            />
          </div> */}

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-normal text-[#2D3D4D]">Price Options</Label>
              {/* <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addOption}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Option
              </Button> */}
            </div>
            
            <div className="space-y-3">
              {options.length > 0 ? (
                options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-sm font-normal text-[#2D3D4D]">Option Name</Label>
                      <Input
                        value={option.name}
                        onChange={(e) => handleOptionChange(index, "name", e.target.value)}
                        placeholder="e.g. Utility room"
                        required
                        className="bg-white h-10 text-base"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-sm font-normal text-[#2D3D4D]">Price Value</Label>
                      <Input
                        value={option.value}
                        onChange={(e) => handleOptionChange(index, "value", e.target.value)}
                        placeholder="e.g. +£1,800"
                        required
                        className="bg-white h-10 text-base"
                      />
                    </div>
                    {/* <div className="pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="h-10 w-10 shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div> */}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center border rounded-lg border-dashed">
                  No options available. Click &apos;Add Option&apos; to create one.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#FBFF26] text-[#1E1E1E] hover:bg-[#FFDE59]/90 text-base h-[48px]"
            >
              {isSaving ? "Saving..." : "Update Quiz Price"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}