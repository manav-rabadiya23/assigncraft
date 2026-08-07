import FormInput from "./FormInput";

export default function AssignmentDetailsSection({ details, onChange }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-lg font-bold text-white">2</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Assignment Details</h2>
          <p className="mt-1 text-sm text-slate-500">Course name, your name, ID and division are saved in this browser.</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput label="Course Name" name="courseName" value={details.courseName} placeholder="Example: BCA" onChange={onChange} />
        <FormInput label="Full Name" name="fullName" value={details.fullName} placeholder="Enter your full name" onChange={onChange} />
        <FormInput label="Student ID" name="studentId" value={details.studentId} placeholder="Example: 24BCA196" onChange={onChange} />
        <FormInput label="Division" name="division" value={details.division} placeholder="Example: 3" onChange={onChange} />
        <FormInput label="Subject" name="subject" value={details.subject} placeholder="Enter subject name" onChange={onChange} />
        <FormInput label="Subject Code" name="subjectCode" value={details.subjectCode} placeholder="Example: CAUC301" onChange={onChange} />
        <FormInput label="Assignment Number" name="assignmentNumber" value={details.assignmentNumber} placeholder="Example: 1" onChange={onChange} />
      </div>
    </section>
  );
}
