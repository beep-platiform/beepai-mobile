-- Increase only the private customer-sample upload cap to 50 MiB.
-- Keep the bucket private and retain its existing MIME allowlist and cleanup policy.
update storage.buckets
set file_size_limit = 52428800
where id = 'beepai-request-samples';
