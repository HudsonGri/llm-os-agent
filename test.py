from canvasapi import Canvas
from dotenv import load_dotenv
import os


load_dotenv()
# Canvas API URL
API_URL = "https://ufl.instructure.com/"
# Canvas API key
API_KEY = os.getenv("CANVAS_API_KEY")

# Initialize a new Canvas object
canvas = Canvas(API_URL, API_KEY)

course = canvas.get_course(525691)

print(course)

files = course.get_files()
announcements = canvas.get_announcements(context_codes=[f"course_{course.id}"])
pages = course.get_pages()
folders = course.get_folders()
due_dates = course.get_gradebook_history_dates()
for announcement in announcements:
    print(0)
    print(announcement.title)
discussions = course.get_discussion_topics(only_announcements=True)

from bs4 import BeautifulSoup


# for topic in discussions:
#     print(f"{topic.title} - {topic.posted_at}")
#     text = BeautifulSoup(topic.message, "html.parser").get_text()
#     print(text)
#     print(topic.html_url)

# c = 0
# for module in course.get_modules():
#     print(f"Module: {module.name}")
#     for item in module.get_module_items():
#         print(f"  - {item.title} ({item.type})")
#         print(f"    Content ID: {item.id}")
#         if (item.type == "Page"):
#             page = course.get_page(item.page_url)
#             print(f"   Page Name: {page.title}")
#             print(f"   Published: {page.published}")
#             print(f"   URL: {page.url}")
#             if page.title != "Module  8":
#                 continue
#             print(f" Content not parsed: {page.body}")
#             text = BeautifulSoup(page.body, "html.parser").get_text()
#             print(f"   Content: {text}")

#             print("content")
#             c+=1
#         if (item.type == "Assignment"):
#             assignment = course.get_assignment(item.content_id)
#             print(f"   Assignment Name: {assignment.name}")
#             text = BeautifulSoup(assignment.description, "html.parser").get_text()
#             # print(f"   Assignment Description: {text}")
#             print(f"   Due Date: {assignment.due_at}")
#             print(f"   Published: {assignment.published}")
#             print(f"   URL: {assignment.html_url}")
#         if (item.type == "Quiz"):
#             quiz = course.get_quiz(item.content_id)
#             print(f"   Quiz Name: {quiz.title}")
#             print(f"   Due Date: {quiz.due_at}")
#             print(f"   Published: {quiz.published}")
#             print(f"   Unlock Date: {quiz.unlock_at}")
#             print(f"   URL: {quiz.html_url}")



#         print(f"    Published: {item.published}")

enrollments = course.get_enrollments(user_id='self')
for enrollment in enrollments:
    print(f"Role: {enrollment.role}")

import requests


user = canvas.get_current_user()
print(f"User ID: {user.id}")
print(f"Name: {user.name}")

for file in files:
    filename = file.display_name
    print(filename)
    file_path = course.get_folder(file.folder_id).full_name + "/" + filename
    print("Step 1")
    file_path = file_path[7:] # remove "course " from file path
    url = file.url.split('/download?download_frd')[0]
    print(file.url)
    print("Step 2")
    _, ext = os.path.splitext(filename)
    response = requests.get(file.url, headers={
    "Authorization": f"Bearer {API_KEY}"
    })
    print(file.locked)
    print(file.locked_for_user)
    print(file.hidden)
    print(file.url)
    print(response.status_code)
    print(response.text)
    full_text = ''
    if ext == ".pdf":
        bytes = file.get_contents(binary=True)



'''
item.type	How to get the full object
"File"	course.get_file(item.content_id)
"Page"	course.get_page(item.page_url) ← not content_id
"Assignment"	course.get_assignment(item.content_id)
"Quiz"	course.get_quiz(item.content_id)
"Discussion"	course.get_discussion_topic(item.content_id)
"ExternalUrl"	item.external_url (no Canvas object)
"ExternalTool"	Often LTI; use item.external_url
'''


# print("First folder:", folders[0])

# for file in files:
    # print(file.url)
    # print(type(file.id))
    # print(file.display_name)
    # print(file.folder_id)
    # print(course.get_folder(file.folder_id).full_name)
    # print(file.updated_at)
    # print(f"{file.display_name} (ID: {file.id}) - Published: {file.published}")
    # print(file.hidden)
    # print(file.locked)
    # print()

visible_files = []
ct = 0

# for file in course.get_files():
#     is_hidden = getattr(file, 'hidden', False)
#     is_locked = getattr(file, 'locked', False)
#     hidden_for_user = getattr(file, 'hidden_for_user', False)

#     if not file.hidden and not file.locked and not file.hidden_for_user:
#         visible_files.append(file)
#     else:
#         ct += 1

# # Output results
# for f in visible_files:
#     print(f"{f.display_name} (ID: {f.id}) - URL: {f.url}")

# print(ct)
# print(c)



# def folder_recurse(folder, path):
#     folders_rec = folder.get_folders()
#     path += str(folder)
#     for folder_rec in folders_rec:
#         folder_recurse(folder_rec, path)
    
#     files = folder.get_files()
#     for file in files:
#         filepath = path + str(file)
#         print(file)
#         print("Filepath", filepath)
#         print("File ID Type: ", type(file.id))



# print(files)
# print()
# print(pages)
# print()

# ct = 0
# for file in files:
#     print(file)
#     print(file.url.split('/download?download_frd')[0])
#     # if (str(file) == "M00_01_COP4600_GomesDeSeiqueira.pptx"):
#     #     print(file.get_contents())
#     print(file.url)
#     if ct == 14:
#         print()
#         print(file.download(str(file)))
#         print(file.url)
#         print()
#     ct += 1
# print()

# for page in pages:
#     print(page)

