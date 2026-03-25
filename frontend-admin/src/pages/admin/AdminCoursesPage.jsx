import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Trash2 } from 'lucide-react';
import AppButton from '../../components/ui/AppButton';
import FormInput from '../../components/ui/FormInput';
import { deleteCourseByAdminApi, getCoursesApi } from '../../features/operations/operationsApi';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const AdminCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const fetchData = async (targetPage = page, targetSearch = debouncedSearch) => {
    setLoading(true);
    try {
      const coursesData = await getCoursesApi({
        include_inactive: true,
        page: targetPage,
        limit: 10,
        search: targetSearch,
      });
      setCourses(Array.isArray(coursesData?.data) ? coursesData.data : []);
      setPagination(coursesData?.pagination || null);
    } catch (error) {
      toast.error(error.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page, debouncedSearch);
  }, [page, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Courses</h2>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <FormInput
            label="Search"
            name="search_courses"
            placeholder="Search courses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[240px]"
          />
          <AppButton type="button" onClick={() => navigate('/admin/courses/create')}>
            <Plus size={16} className="mr-1" />
            Create Course
          </AppButton>
        </div>
      </div>

      {loading ? <p className="text-sm text-gray-500 dark:text-gray-400">Loading courses...</p> : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Stable</th>
              <th className="px-3 py-2">Coach</th>
              <th className="px-3 py-2">Max Enroll</th>
              <th className="px-3 py-2">Visibility</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{course.title}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{course.course_type}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{course.stable?.name || '-'}</td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                  {course.coach?.first_name || '-'} {course.coach?.last_name || ''}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{course.max_enrollment ?? '-'}</td>
                <td className="px-3 py-2">
                  {(() => {
                    const v = course.visibility || 'public';
                    const styles = {
                      public: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
                      my_riders: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
                      private: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                    };
                    const labels = { public: 'Public', my_riders: 'My Riders', private: 'Private' };
                    return (
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[v] || styles.public}`}>
                        {labels[v] || v}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      course.is_active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {course.is_active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      type="button"
                      onClick={() => navigate(`/admin/courses/${course.id}`)}
                    >
                      <Eye size={14} /> View
                    </button>
                    {course.is_active && (
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`Deactivate course "${course.title}"?`)) return;
                          try {
                            await deleteCourseByAdminApi(course.id);
                            toast.success('Course deactivated.');
                            await fetchCourses(page, debouncedSearch);
                          } catch (err) {
                            toast.error(err?.response?.data?.message || err.message || 'Failed to deactivate course.');
                          }
                        }}
                      >
                        <Trash2 size={12} /> Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !courses.length ? (
              <tr className="border-t border-gray-200 dark:border-gray-800">
                <td colSpan={8} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No courses found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <AppButton
          type="button"
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          disabled={!pagination?.hasPrev || loading}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Prev
        </AppButton>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Page {pagination?.currentPage || 1} of {pagination?.totalPages || 1}
        </span>
        <AppButton
          type="button"
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          disabled={!pagination?.hasNext || loading}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </AppButton>
      </div>
    </section>
  );
};

export default AdminCoursesPage;
