import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { APPLICATION_STATUSES, type Application, type ApplicationInput } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

const schema = z.object({
  company: z.string().min(1, "Company is required").max(255),
  role: z.string().min(1, "Role is required").max(255),
  status: z.enum(APPLICATION_STATUSES),
  applied_date: z.string().optional(),
  deadline: z.string().optional(),
  follow_up_date: z.string().optional(),
  job_link: z
    .union([z.literal(""), z.string().url("Enter a valid URL, e.g. https://company.com/job/123")])
    .optional(),
  notes: z.string().max(10_000).optional(),
});

type FormValues = z.infer<typeof schema>;

export function ApplicationForm({
  initialValues,
  isEdit = false,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialValues?: Partial<Application>;
  isEdit?: boolean;
  onSubmit: (input: ApplicationInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      company: initialValues?.company ?? "",
      role: initialValues?.role ?? "",
      status: initialValues?.status ?? "Applied",
      applied_date: initialValues?.applied_date ?? "",
      deadline: initialValues?.deadline ?? "",
      follow_up_date: initialValues?.follow_up_date ?? "",
      job_link: initialValues?.job_link ?? "",
      notes: initialValues?.notes ?? "",
    },
  });

  const submit = (values: FormValues) => {
    onSubmit({
      company: values.company,
      role: values.role,
      status: values.status,
      applied_date: values.applied_date || null,
      deadline: values.deadline || null,
      follow_up_date: values.follow_up_date || null,
      job_link: values.job_link || null,
      notes: values.notes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Company" error={errors.company?.message} {...register("company")} />
        <Input label="Role" error={errors.role?.message} {...register("role")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Status" error={errors.status?.message} {...register("status")}>
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Input
          label="Applied date"
          type="date"
          error={errors.applied_date?.message}
          {...register("applied_date")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Deadline" type="date" error={errors.deadline?.message} {...register("deadline")} />
        <Input
          label="Follow-up date"
          type="date"
          error={errors.follow_up_date?.message}
          {...register("follow_up_date")}
        />
      </div>

      <Input
        label="Job link"
        type="url"
        placeholder="https://…"
        error={errors.job_link?.message}
        {...register("job_link")}
      />

      <Textarea label="Notes" rows={4} error={errors.notes?.message} {...register("notes")} />

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? "Save changes" : "Add application"}
        </Button>
      </div>
    </form>
  );
}
